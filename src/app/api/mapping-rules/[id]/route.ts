import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthUser } from "@/lib/auth";

const schema = z.object({
  pattern: z.string().min(1).optional(),
  replacement: z.string().min(1).optional(),
  condition: z.string().nullable().optional(),
  priority: z.number().int().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const rule = await prisma.mappingRule.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(rule);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  await prisma.mappingRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
