import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { decryptDmBody } from "@/lib/crypto/dm";

const ViewSchema = z.object({ viewReason: z.string().min(10).max(1000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user || user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ViewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const flag = await prisma.flag.findUnique({ where: { id: params.id } });
  if (!flag || flag.targetType !== "DM_MESSAGE") {
    return NextResponse.json({ error: "Not a DM flag" }, { status: 400 });
  }
  if (!flag.messageId) return NextResponse.json({ error: "No message ID in flag" }, { status: 400 });

  // Get message and context
  const message = await prisma.message.findUnique({ where: { id: flag.messageId } });
  if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  const context = await prisma.message.findMany({
    where: { conversationId: message.conversationId, isDeleted: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { sender: { select: { id: true, displayName: true, name: true } } },
  });

  // Audit log BEFORE returning data — mandatory
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "DM_VIEWED_BY_ADMIN",
      entityType: "message",
      entityId: flag.messageId,
      metadata: { flagId: params.id, viewReason: parsed.data.viewReason },
    },
  });

  const decryptedContext = context.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender.displayName ?? m.sender.name,
    body: m.isDeleted ? "[DELETED]" : decryptDmBody(m.encryptedBody),
    createdAt: m.createdAt,
  }));

  return NextResponse.json({ context: decryptedContext });
}
