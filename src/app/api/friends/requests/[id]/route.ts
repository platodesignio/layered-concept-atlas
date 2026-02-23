import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const ActionSchema = z.object({
  action: z.enum(["accept", "decline", "cancel"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = await prisma.friendRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { action } = parsed.data;

  if (action === "accept" || action === "decline") {
    if (request.receiverId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  if (action === "cancel") {
    if (request.senderId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const statusMap: Record<string, "ACCEPTED" | "DECLINED" | "CANCELLED"> = {
    accept: "ACCEPTED",
    decline: "DECLINED",
    cancel: "CANCELLED",
  };

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.friendRequest.update({
      where: { id: params.id },
      data: { status: statusMap[action] },
    });
    if (action === "accept") {
      await tx.friendship.create({
        data: {
          userAId: request.senderId < request.receiverId ? request.senderId : request.receiverId,
          userBId: request.senderId < request.receiverId ? request.receiverId : request.senderId,
        },
      });
      await tx.timelineEvent.create({
        data: {
          kind: "FRIEND_ACCEPTED",
          actorId: user.id,
          targetUserId: request.senderId,
          visibility: "FRIENDS_ONLY",
        },
      });
      await tx.notification.create({
        data: {
          userId: request.senderId,
          kind: "FRIEND_ACCEPTED",
          title: "友達申請が承認されました",
          body: `${user.displayName ?? user.name ?? user.email} が友達申請を承認しました。`,
          linkUrl: "/friends",
        },
      });
    }
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: `FRIEND_REQUEST_${action.toUpperCase()}`,
        entityType: "friend_request",
        entityId: r.id,
        metadata: { action },
      },
    });
    return r;
  });

  return NextResponse.json({ request: updated });
}
