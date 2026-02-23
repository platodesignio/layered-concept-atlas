import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { TimelineVisibility } from "@prisma/client";

const UpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  friendListPublic: z.boolean().optional(),
  timelineVisibility: z.nativeEnum(TimelineVisibility).optional(),
  dmFromFriendsOnly: z.boolean().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      bio: true,
      role: true,
      isFrozen: true,
      walletAddress: true,
      friendListPublic: true,
      timelineVisibility: true,
      dmFromFriendsOnly: true,
      createdAt: true,
      networkMembership: { select: { status: true, currentPeriodEnd: true } },
      walletConnections: { select: { address: true, chainId: true, verifiedAt: true } },
      _count: { select: { follows: true, friendshipsA: true, friendshipsB: true } },
    },
  });

  return NextResponse.json({ user: full });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: parsed.data,
    select: { id: true, displayName: true, bio: true, friendListPublic: true, timelineVisibility: true, dmFromFriendsOnly: true },
  });

  return NextResponse.json({ user: updated });
}
