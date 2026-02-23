import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const FollowSchema = z.object({ projectId: z.string() });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = FollowSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { projectId } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.follow.upsert({
      where: { userId_projectId: { userId: user.id, projectId } },
      create: { userId: user.id, projectId },
      update: {},
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "FOLLOW_ADDED",
        entityType: "follow",
        entityId: projectId,
      },
    });
    await tx.timelineEvent.create({
      data: {
        kind: "FOLLOW_ADDED",
        actorId: user.id,
        projectId,
        visibility: "FRIENDS_ONLY",
      },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.follow.deleteMany({ where: { userId: user.id, projectId } });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "FOLLOW_REMOVED",
        entityType: "follow",
        entityId: projectId,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
