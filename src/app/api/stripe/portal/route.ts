import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.stripeCustomer.findUnique({ where: { userId: user.id } });
  if (!customer) return NextResponse.json({ error: "No billing account" }, { status: 404 });

  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
