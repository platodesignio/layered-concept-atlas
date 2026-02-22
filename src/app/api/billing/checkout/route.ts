export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe, PLANS } from "@/lib/stripe";
import { requireUser, isAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

const schema = z.object({
  plan: z.enum(["creator", "axis"]),
});

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!isAuthUser(user)) return user;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "planを指定してください (creator | axis)" }, { status: 400 });
  }

  const { plan } = parsed.data;
  const planConfig = PLANS[plan];

  if (!planConfig.priceId) {
    return NextResponse.json(
      { error: `${plan}プランの価格IDが設定されていません。管理者に連絡してください。` },
      { status: 500 }
    );
  }

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

  // Get or create Stripe customer
  let stripeCustomerId: string;
  const existingCustomer = await prisma.stripeCustomer.findUnique({
    where: { userId: user.id },
  });

  if (existingCustomer) {
    stripeCustomerId = existingCustomer.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.stripeCustomer.create({
      data: { userId: user.id, stripeCustomerId },
    });
  }

  // Check for active subscription
  const existingSub = await prisma.subscription.findUnique({
    where: { userId: user.id },
  });
  if (existingSub && (existingSub.status === "active" || existingSub.status === "trialing")) {
    return NextResponse.json(
      { error: "既にアクティブなサブスクリプションがあります。Billing Portalからプランを変更してください。" },
      { status: 409 }
    );
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${baseUrl}/billing?success=1&plan=${plan}`,
    cancel_url: `${baseUrl}/billing?canceled=1`,
    metadata: { userId: user.id, plan },
    subscription_data: {
      metadata: { userId: user.id, plan },
    },
    locale: "ja",
  });

  await createAuditLog({
    userId: user.id,
    action: "CHECKOUT_START",
    entityType: "Billing",
    entityId: session.id,
    diff: { plan, priceId: planConfig.priceId },
  });

  return NextResponse.json({ url: session.url });
}
