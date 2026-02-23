import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isNetworkMember } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";

const VoteSchema = z.object({ projectId: z.string() });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  const rl = await rateLimit(req, "vote", user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await req.json();
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { projectId } = parsed.data;

  // Must be network member or admin
  const isMember = await isNetworkMember(user.id);
  if (!isMember && user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Network membership required to vote" }, { status: 403 });
  }

  // Wallet required for vote
  if (!user.walletAddress) {
    return NextResponse.json({ error: "Wallet connection required to vote" }, { status: 403 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.isFrozen) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  try {
    const vote = await prisma.$transaction(async (tx) => {
      const v = await tx.vote.create({
        data: { projectId, userId: user.id },
      });
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "VOTE_CAST",
          entityType: "vote",
          entityId: v.id,
          metadata: { projectId },
        },
      });
      await tx.timelineEvent.create({
        data: {
          kind: "VOTE_CAST",
          actorId: user.id,
          projectId,
          visibility: "NETWORK_ONLY",
        },
      });
      return v;
    });
    return NextResponse.json({ vote }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already voted for this project" }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  await prisma.vote.deleteMany({ where: { projectId, userId: user.id } });
  return NextResponse.json({ ok: true });
}
