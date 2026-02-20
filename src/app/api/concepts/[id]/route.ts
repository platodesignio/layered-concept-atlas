import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

const updateSchema = z.object({
  titleJa: z.string().min(1).max(200).optional(),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

const entrySchema = z.object({
  layerId: z.string(),
  content: z.string().min(1),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const concept = await prisma.concept.findFirst({
    where: { OR: [{ id: params.id }, { slug: params.id }] },
    include: {
      layerEntries: {
        include: { layer: { select: { id: true, slug: true, nameJa: true, colorClass: true, index: true } } },
        orderBy: { layer: { index: "asc" } },
      },
      linksFrom: { include: { to: { select: { id: true, slug: true, titleJa: true } } } },
    },
  });

  if (!concept) {
    return NextResponse.json({ error: "概念が見つかりません" }, { status: 404 });
  }
  return NextResponse.json(concept);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const before = await prisma.concept.findUnique({ where: { id: params.id } });
  if (!before) return NextResponse.json({ error: "概念が見つかりません" }, { status: 404 });

  const updated = await prisma.concept.update({
    where: { id: params.id },
    data: parsed.data,
  });

  await createAuditLog({
    userId: admin.id,
    action: "UPDATE",
    entityType: "Concept",
    entityId: params.id,
    diff: { before, after: updated },
  });

  return NextResponse.json(updated);
}

// PATCH: update a single layer entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const body = await req.json().catch(() => null);
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const concept = await prisma.concept.findUnique({ where: { id: params.id } });
  if (!concept) return NextResponse.json({ error: "概念が見つかりません" }, { status: 404 });

  const entry = await prisma.layerEntry.upsert({
    where: {
      conceptId_layerId: {
        conceptId: params.id,
        layerId: parsed.data.layerId,
      },
    },
    update: { content: parsed.data.content },
    create: {
      conceptId: params.id,
      layerId: parsed.data.layerId,
      content: parsed.data.content,
    },
  });

  await createAuditLog({
    userId: admin.id,
    action: "UPDATE_ENTRY",
    entityType: "LayerEntry",
    entityId: entry.id,
    diff: { content: parsed.data.content },
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const concept = await prisma.concept.findUnique({ where: { id: params.id } });
  if (!concept) return NextResponse.json({ error: "概念が見つかりません" }, { status: 404 });

  await prisma.concept.delete({ where: { id: params.id } });

  await createAuditLog({
    userId: admin.id,
    action: "DELETE",
    entityType: "Concept",
    entityId: params.id,
    diff: { before: concept },
  });

  return NextResponse.json({ ok: true });
}
