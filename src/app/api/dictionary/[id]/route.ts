import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthUser } from "@/lib/auth";

const schema = z.object({
  term: z.string().min(1).max(100).optional(),
  weight: z.number().min(0.1).max(10).optional(),
  isNegation: z.boolean().optional(),
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

  const term = await prisma.dictionaryTerm.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json(term);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  await prisma.dictionaryTerm.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
