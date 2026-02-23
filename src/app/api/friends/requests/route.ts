import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";

const SendSchema = z.object({
  receiverId: z.string(),
  message: z.string().max(500).optional(),
});

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [incoming, outgoing] = await Promise.all([
    prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: "PENDING" },
      include: { sender: { select: { id: true, displayName: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendRequest.findMany({
      where: { senderId: user.id, status: { in: ["PENDING", "DECLINED"] } },
      include: { receiver: { select: { id: true, displayName: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ incoming, outgoing });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  const rl = await rateLimit(req, "friend:request", user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await req.json();
  const parsed = SendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { receiverId, message } = parsed.data;
  if (receiverId === user.id) return NextResponse.json({ error: "Cannot send request to self" }, { status: 400 });

  // Check for blocks
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: receiverId },
        { blockerId: receiverId, blockedId: user.id },
      ],
    },
  });
  if (block) return NextResponse.json({ error: "Cannot send request" }, { status: 403 });

  // Check existing friendship
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userAId: user.id, userBId: receiverId },
        { userAId: receiverId, userBId: user.id },
      ],
    },
  });
  if (existing) return NextResponse.json({ error: "Already friends" }, { status: 409 });

  try {
    const request = await prisma.$transaction(async (tx) => {
      const r = await tx.friendRequest.create({
        data: { senderId: user.id, receiverId, message, status: "PENDING" },
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "FRIEND_REQUEST_SENT",
          entityType: "friend_request",
          entityId: r.id,
          metadata: { receiverId },
        },
      });
      await tx.notification.create({
        data: {
          userId: receiverId,
          kind: "FRIEND_REQUEST",
          title: "友達申請が届きました",
          body: `${user.displayName ?? user.name ?? user.email} から友達申請が届きました。`,
          linkUrl: "/friends",
        },
      });
      return r;
    });
    return NextResponse.json({ request }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Friend request already exists" }, { status: 409 });
  }
}
