import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const DeleteSchema = z.object({ reason: z.string().min(5).max(500) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const message = await prisma.message.findUnique({ where: { id: params.id } });
  if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (message.senderId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (message.isDeleted) return NextResponse.json({ error: "Already deleted" }, { status: 400 });

  const body = await req.json();
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: params.id },
      data: { isDeleted: true, deletedAt: new Date(), deleteReason: parsed.data.reason },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "DM_DELETED",
        entityType: "message",
        entityId: params.id,
        metadata: { reason: parsed.data.reason },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
