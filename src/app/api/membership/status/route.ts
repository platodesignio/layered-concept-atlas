/**
 * GET /api/membership/status
 * 現在のログインユーザーのネットワーク会員ステータスを返す。
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatEther } from "viem";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.networkMembership.findUnique({
    where: { userId: user.id },
  });

  // 期限切れの場合はステータスを expired に更新
  if (membership && membership.status === "active" && membership.validUntil != null && membership.validUntil < new Date()) {
    await prisma.networkMembership.update({
      where: { userId: user.id },
      data: { status: "expired" },
    });
    membership.status = "expired";
  }

  const requiredAmountWei = BigInt(process.env.MEMBERSHIP_AMOUNT_WEI ?? "0");
  const receiptAddress = process.env.MEMBERSHIP_RECEIPT_ADDRESS ?? "";

  return NextResponse.json({
    membership: membership
      ? {
          status: membership.status,
          validUntil: membership.validUntil,
          validFrom: membership.validFrom,
          txHash: membership.txHash,
          amountEth: formatEther(BigInt(membership.amountWei)),
        }
      : null,
    // クライアントが支払い画面を表示するために必要な情報
    paymentInfo: {
      receiptAddress,
      requiredAmountEth: requiredAmountWei > BigInt(0) ? formatEther(requiredAmountWei) : null,
      chainId: 8453,
      chainName: "Base Mainnet",
    },
  });
}
