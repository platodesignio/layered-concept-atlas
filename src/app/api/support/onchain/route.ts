import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";

const OnchainSchema = z.object({
  projectId: z.string(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  amountWei: z.string(),
  chainId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.walletAddress) return NextResponse.json({ error: "Wallet connection required" }, { status: 403 });
  if (user.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  const body = await req.json();
  const parsed = OnchainSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { projectId, txHash, amountWei, chainId } = parsed.data;
  const expectedChainId = parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID ?? "8453");
  if (chainId !== expectedChainId) {
    return NextResponse.json({ error: `Only chainId ${expectedChainId} (Base mainnet) is supported` }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.isFrozen) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!project.receiptAddress) return NextResponse.json({ error: "Project has no receipt address" }, { status: 400 });

  const support = await prisma.$transaction(async (tx) => {
    const s = await tx.support.create({
      data: {
        projectId,
        userId: user.id,
        kind: "ONCHAIN_ETH",
        txHash,
        amountWei,
        chainId,
        confirmedAt: new Date(),
      },
    });
    await tx.supporterBadge.create({
      data: { supportId: s.id, userId: user.id, projectId },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "SUPPORT_ONCHAIN",
        entityType: "support",
        entityId: s.id,
        metadata: { projectId, txHash, amountWei, chainId },
      },
    });
    await tx.timelineEvent.create({
      data: {
        kind: "SUPPORT_ONCHAIN",
        actorId: user.id,
        projectId,
        visibility: "NETWORK_ONLY",
        metadata: { txHash, amountWei },
      },
    });
    return s;
  });

  return NextResponse.json({ support }, { status: 201 });
}
