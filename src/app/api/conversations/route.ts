import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const CreateSchema = z.object({ participantId: z.string() });

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    include: {
      participants: {
        include: { user: { select: { id: true, displayName: true, name: true, email: true } } },
      },
      messages: {
        where: { isDeleted: false },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Calculate unread counts
  const enriched = await Promise.all(
    conversations.map(async (c) => {
      const participant = c.participants.find((p) => p.userId === user.id);
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: c.id,
          isDeleted: false,
          createdAt: participant?.lastReadAt ? { gt: participant.lastReadAt } : undefined,
          senderId: { not: user.id },
        },
      });
      return { ...c, unreadCount };
    })
  );

  return NextResponse.json({ conversations: enriched });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { participantId } = parsed.data;
  if (participantId === user.id) return NextResponse.json({ error: "Cannot DM yourself" }, { status: 400 });

  // Must be friends
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: user.id, userBId: participantId },
        { userAId: participantId, userBId: user.id },
      ],
    },
  });
  if (!friendship) return NextResponse.json({ error: "Must be friends to start a conversation" }, { status: 403 });

  // Check for blocks
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: participantId },
        { blockerId: participantId, blockedId: user.id },
      ],
    },
  });
  if (block) return NextResponse.json({ error: "Cannot start conversation" }, { status: 403 });

  // Find existing conversation between these two
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: participantId } } },
      ],
    },
    include: {
      participants: { include: { user: { select: { id: true, displayName: true, name: true } } } },
    },
  });

  if (existing) {
    const participantCount = await prisma.conversationParticipant.count({
      where: { conversationId: existing.id },
    });
    if (participantCount === 2) return NextResponse.json({ conversation: existing });
  }

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: user.id }, { userId: participantId }],
      },
    },
    include: {
      participants: { include: { user: { select: { id: true, displayName: true, name: true } } } },
    },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
