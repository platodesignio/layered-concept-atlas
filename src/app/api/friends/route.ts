import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friendships = await prisma.friendship.findMany({
    where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    include: {
      userA: { select: { id: true, displayName: true, name: true, email: true } },
      userB: { select: { id: true, displayName: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships.map((f) => (f.userAId === user.id ? f.userB : f.userA));
  return NextResponse.json({ friends });
}
