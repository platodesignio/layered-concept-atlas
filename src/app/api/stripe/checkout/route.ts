import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";

  // Find or create Stripe customer
  let stripeCustomerId: string;
  const existing = await prisma.stripeCustomer.findUnique({ where: { userId: user.id } });
  if (existing) {
    stripeCustomerId = existing.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    await prisma.stripeCustomer.create({
      data: { userId: user.id, stripeCustomerId: customer.id },
    });
    stripeCustomerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    line_items: [{ price: process.env.STRIPE_PRICE_ID_MEMBERSHIP!, quantity: 1 }],
    mode: "subscription",
    success_url: `${appUrl}/billing?success=1`,
    cancel_url: `${appUrl}/billing?canceled=1`,
    metadata: { userId: user.id },
  });

  return NextResponse.json({ url: session.url });
}
