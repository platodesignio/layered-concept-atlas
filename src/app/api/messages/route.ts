import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { encryptDmBody, decryptDmBody } from "@/lib/crypto/dm";
import { publishEvent } from "@/lib/realtime";
import { rateLimit } from "@/lib/rateLimit";

const SendSchema = z.object({
  conversationId: z.string(),
  body: z.string().min(1).max(10000),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "conversationId required" }, { status: 400 });

  // Verify participation
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const skip = (page - 1) * limit;

  const messages = await prisma.message.findMany({
    where: { conversationId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
    include: { sender: { select: { id: true, displayName: true, name: true } } },
  });

  // Decrypt messages
  const decrypted = messages.map((m) => ({
    ...m,
    body: decryptDmBody(m.encryptedBody),
    encryptedBody: undefined,
  }));

  // Update lastReadAt
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ messages: decrypted.reverse() });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  const rl = await rateLimit(req, "message:send", user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await req.json();
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { conversationId, body: messageBody } = parsed.data;

  // Verify participation
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  });
  if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get all participants to check blocks
  const allParticipants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
  });
  const otherIds = allParticipants.filter((p) => p.userId !== user.id).map((p) => p.userId);

  for (const otherId of otherIds) {
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: user.id, blockedId: otherId },
          { blockerId: otherId, blockedId: user.id },
        ],
      },
    });
    if (block) return NextResponse.json({ error: "Cannot send message" }, { status: 403 });
  }

  const encrypted = encryptDmBody(messageBody);
  const message = await prisma.$transaction(async (tx) => {
    const m = await tx.message.create({
      data: { conversationId, senderId: user.id, encryptedBody: encrypted },
      include: { sender: { select: { id: true, displayName: true, name: true } } },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "DM_SENT",
        entityType: "message",
        entityId: m.id,
        metadata: { conversationId },
      },
    });
    // Notify other participants
    for (const otherId of otherIds) {
      await tx.notification.create({
        data: {
          userId: otherId,
          kind: "DM_RECEIVED",
          title: "新しいメッセージが届きました",
          body: `${user.displayName ?? user.name ?? user.email} からメッセージが届きました。`,
          linkUrl: `/messages/${conversationId}`,
        },
      });
    }
    return m;
  });

  // Realtime push
  await publishEvent({
    channel: `conversation-${conversationId}`,
    event: "new-message",
    data: {
      id: message.id,
      conversationId,
      senderId: user.id,
      body: messageBody,
      createdAt: message.createdAt,
    },
  }).catch(() => {}); // Non-critical

  return NextResponse.json({
    message: { ...message, body: messageBody, encryptedBody: undefined },
  }, { status: 201 });
}
