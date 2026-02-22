export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { requireUser, isAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await requireUser();
  if (!isAuthUser(user)) return user;

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  const customer = await prisma.stripeCustomer.findUnique({
    where: { userId: user.id },
  });

  if (!customer) {
    return NextResponse.json(
      { error: "Stripeカスタマー情報が見つかりません。先にプランを選択してください。" },
      { status: 404 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${baseUrl}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
