import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const UpdateSchema = z.object({
  title: z.string().min(2).max(300).optional(),
  content: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const node = await prisma.stpfNode.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, displayName: true, name: true } },
      project: { select: { id: true, title: true } },
      linksFrom: { include: { toNode: { select: { id: true, title: true, type: true } } } },
      linksTo: { include: { fromNode: { select: { id: true, title: true, type: true } } } },
    },
  });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ node });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const node = await prisma.stpfNode.findUnique({ where: { id } });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (node.authorId !== user.id && user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.$transaction(async (tx) => {
    const updateData = {
      ...parsed.data,
      ...(parsed.data.content !== undefined ? { content: JSON.parse(JSON.stringify(parsed.data.content)) } : {}),
    };
    const n = await tx.stpfNode.update({
      where: { id },
      data: updateData,
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "STPF_NODE_UPDATED",
        entityType: "stpf_node",
        entityId: n.id,
        metadata: { changes: JSON.parse(JSON.stringify(parsed.data)) },
      },
    });
    return n;
  });

  return NextResponse.json({ node: updated });
}
