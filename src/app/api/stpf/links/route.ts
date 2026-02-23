import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const LinkSchema = z.object({
  fromNodeId: z.string(),
  toNodeId: z.string(),
  linkType: z.enum(["derived_from", "validates", "implements", "observes"]),
  description: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = LinkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { fromNodeId, toNodeId, linkType, description } = parsed.data;

  const fromNode = await prisma.stpfNode.findUnique({ where: { id: fromNodeId } });
  const toNode = await prisma.stpfNode.findUnique({ where: { id: toNodeId } });
  if (!fromNode || !toNode) return NextResponse.json({ error: "Node not found" }, { status: 404 });
  if (fromNode.projectId !== toNode.projectId) {
    return NextResponse.json({ error: "Nodes must belong to the same project" }, { status: 400 });
  }

  const link = await prisma.stpfLink.create({
    data: { fromNodeId, toNodeId, linkType, description },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "STPF_LINK_CREATED",
      entityType: "stpf_link",
      entityId: link.id,
      metadata: { fromNodeId, toNodeId, linkType },
    },
  });

  return NextResponse.json({ link }, { status: 201 });
}
