import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { TimelineVisibility } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  const { searchParams } = new URL(req.url);

  const filter = searchParams.get("filter") ?? "Network";
  const cursor = searchParams.get("cursor");
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  // Determine which visibilities to show
  let visibilityFilter: TimelineVisibility[] = ["PUBLIC"];
  if (user) {
    visibilityFilter = ["PUBLIC", "NETWORK_ONLY"];

    // Get friend IDs for FRIENDS_ONLY events
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
      select: { userAId: true, userBId: true },
    });
    const friendIds = friendships.map((f) => (f.userAId === user.id ? f.userBId : f.userAId));

    const where: Record<string, unknown> = {
      visibility: { in: visibilityFilter },
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    };

    if (filter === "Friends" && user) {
      where.actorId = { in: [...friendIds, user.id] };
      (where.visibility as Record<string, unknown>) = { in: ["PUBLIC", "NETWORK_ONLY", "FRIENDS_ONLY"] };
    } else if (filter === "ProjectsFollowed" && user) {
      const follows = await prisma.follow.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      });
      where.projectId = { in: follows.map((f) => f.projectId) };
    } else if (filter === "Self" && user) {
      where.actorId = user.id;
      (where.visibility as Record<string, unknown>) = { in: ["PUBLIC", "NETWORK_ONLY", "FRIENDS_ONLY", "PRIVATE"] };
    }

    const events = await prisma.timelineEvent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actor: { select: { id: true, displayName: true, name: true } },
        project: { select: { id: true, title: true, slug: true } },
        report: { select: { id: true, outcomes: true } },
      },
    });

    const nextCursor = events.length === limit ? events[events.length - 1].createdAt.toISOString() : null;
    return NextResponse.json({ events, nextCursor });
  }

  // Unauthenticated: only PUBLIC
  const where: Record<string, unknown> = {
    visibility: "PUBLIC",
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  };

  const events = await prisma.timelineEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { id: true, displayName: true, name: true } },
      project: { select: { id: true, title: true, slug: true } },
    },
  });

  const nextCursor = events.length === limit ? events[events.length - 1].createdAt.toISOString() : null;
  return NextResponse.json({ events, nextCursor });
}
