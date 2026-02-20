import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthUser } from "@/lib/auth";

const createSchema = z.object({
  layerId: z.string(),
  term: z.string().min(1).max(100),
  weight: z.number().min(0.1).max(10).optional(),
  isNegation: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const layerId = searchParams.get("layerId");

  const terms = await prisma.dictionaryTerm.findMany({
    where: layerId ? { layerId } : undefined,
    include: { layer: { select: { slug: true, nameJa: true } } },
    orderBy: [{ layerId: "asc" }, { weight: "desc" }],
  });
  return NextResponse.json(terms);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const term = await prisma.dictionaryTerm.create({ data: parsed.data });
  return NextResponse.json(term, { status: 201 });
}
