import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.conversationParticipant.updateMany({
    where: { conversationId: id, userId: user.id },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
