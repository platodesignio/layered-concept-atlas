import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const FreezeSchema = z.object({
  targetType: z.enum(["user", "project"]),
  targetId: z.string(),
  reason: z.string().min(10).max(1000),
  freeze: z.boolean(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = FreezeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { targetType, targetId, reason, freeze } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (targetType === "user") {
      await tx.user.update({
        where: { id: targetId },
        data: {
          isFrozen: freeze,
          frozenAt: freeze ? new Date() : null,
          frozenReason: freeze ? reason : null,
        },
      });
    } else {
      await tx.project.update({
        where: { id: targetId },
        data: {
          isFrozen: freeze,
          frozenAt: freeze ? new Date() : null,
          frozenReason: freeze ? reason : null,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: freeze ? `${targetType.toUpperCase()}_FROZEN` : `${targetType.toUpperCase()}_UNFROZEN`,
        entityType: targetType,
        entityId: targetId,
        metadata: { reason },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
