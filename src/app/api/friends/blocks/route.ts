import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const BlockSchema = z.object({ targetUserId: z.string() });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BlockSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { targetUserId } = parsed.data;
  if (targetUserId === user.id) return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.block.upsert({
      where: { blockerId_blockedId: { blockerId: user.id, blockedId: targetUserId } },
      create: { blockerId: user.id, blockedId: targetUserId },
      update: {},
    });
    // Remove friendship and pending requests
    await tx.friendship.deleteMany({
      where: {
        OR: [
          { userAId: user.id, userBId: targetUserId },
          { userAId: targetUserId, userBId: user.id },
        ],
      },
    });
    await tx.friendRequest.updateMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUserId, status: "PENDING" },
          { senderId: targetUserId, receiverId: user.id, status: "PENDING" },
        ],
      },
      data: { status: "BLOCKED" },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_BLOCKED",
        entityType: "block",
        entityId: targetUserId,
        metadata: { targetUserId },
      },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("targetUserId");
  if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.block.deleteMany({
      where: { blockerId: user.id, blockedId: targetUserId },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "USER_UNBLOCKED",
        entityType: "block",
        entityId: targetUserId,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
