export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { requireUser, isAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCapabilities } from "@/lib/authz";

export async function GET() {
  const user = await requireUser();
  if (!isAuthUser(user)) return user;

  const [subscription, entitlement] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }).catch(() => null),
    prisma.entitlement.findUnique({ where: { userId: user.id } }).catch(() => null),
  ]);

  const capabilities = await getCapabilities(user.id);

  return NextResponse.json({
    plan: subscription?.plan ?? "FREE",
    status: subscription?.status ?? "none",
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    capabilities,
    entitlementSource: entitlement?.source ?? "system",
  });
}
