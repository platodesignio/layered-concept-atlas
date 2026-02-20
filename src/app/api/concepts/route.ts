import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

const createSchema = z.object({
  slug: z.string().min(1).max(100),
  titleJa: z.string().min(1).max(200),
  summary: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");
  const published = searchParams.get("published");

  const where: Record<string, unknown> = {};
  if (tag) where.tags = { has: tag };
  if (q) where.titleJa = { contains: q };
  if (published === "true") where.isPublished = true;

  const [total, concepts] = await Promise.all([
    prisma.concept.count({ where }),
    prisma.concept.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { layerEntries: { include: { layer: true } } },
    }),
  ]);

  return NextResponse.json({ concepts, total, page, limit });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const existing = await prisma.concept.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return NextResponse.json({ error: "このスラッグは既に使用されています" }, { status: 409 });
  }

  const concept = await prisma.concept.create({
    data: {
      ...parsed.data,
      tags: parsed.data.tags ?? [],
    },
  });

  await createAuditLog({
    userId: admin.id,
    action: "CREATE",
    entityType: "Concept",
    entityId: concept.id,
    diff: { after: concept },
  });

  return NextResponse.json(concept, { status: 201 });
}
