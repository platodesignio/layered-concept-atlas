import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthUser } from "@/lib/auth";

const createSchema = z.object({
  fromLayerId: z.string(),
  toLayerId: z.string(),
  pattern: z.string().min(1),
  replacement: z.string().min(1),
  condition: z.string().optional(),
  priority: z.number().int().optional(),
});

export async function GET() {
  const rules = await prisma.mappingRule.findMany({
    include: {
      fromLayer: { select: { slug: true, nameJa: true } },
      toLayer: { select: { slug: true, nameJa: true } },
    },
    orderBy: [{ fromLayerId: "asc" }, { priority: "desc" }],
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const rule = await prisma.mappingRule.create({ data: parsed.data });
  return NextResponse.json(rule, { status: 201 });
}
