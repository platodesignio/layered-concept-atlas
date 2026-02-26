import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id, isFrozen: false },
    select: {
      id: true,
      displayName: true,
      name: true,
      bio: true,
      createdAt: true,
      walletAddress: true,
      friendListPublic: true,
      _count: { select: { projects: true, follows: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}
