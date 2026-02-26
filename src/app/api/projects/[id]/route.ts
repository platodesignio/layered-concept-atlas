import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isProjectMember } from "@/lib/session";
import { canManageProject } from "@/lib/authz";
import { Visibility } from "@prisma/client";

const UpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
  receiptAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { OR: [{ id }, { slug: id }], isFrozen: false },
    include: {
      owner: { select: { id: true, displayName: true, name: true } },
      members: {
        include: { user: { select: { id: true, displayName: true, name: true } } },
      },
      stpfNodes: { orderBy: { createdAt: "asc" } },
      _count: { select: { votes: true, supports: true, reports: true, follows: true } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isPM = await isProjectMember(user.id, id);
  if (!canManageProject(user.role, isPM && project.ownerId === user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.project.update({
      where: { id: id },
      data: parsed.data,
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "PROJECT_UPDATED",
        entityType: "project",
        entityId: id,
        metadata: JSON.parse(JSON.stringify(parsed.data)),
      },
    });
    return p;
  });

  return NextResponse.json({ project: updated });
}
