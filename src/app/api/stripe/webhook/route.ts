import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.billingEvent.findUnique({ where: { stripeEventId: event.id } });
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true });
  }

  await prisma.billingEvent.upsert({
    where: { stripeEventId: event.id },
    create: { stripeEventId: event.id, type: event.type, payloadJson: JSON.parse(JSON.stringify(event)) },
    update: {},
  });

  try {
    await handleEvent(event);
    await prisma.billingEvent.update({
      where: { stripeEventId: event.id },
      data: { processedAt: new Date(), processResult: "ok" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.billingEvent.update({
      where: { stripeEventId: event.id },
      data: { processedAt: new Date(), processResult: `error:${msg}` },
    });
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await prisma.stripeCustomer.findUnique({
        where: { stripeCustomerId: sub.customer as string },
      });
      if (!customer) return;

      await prisma.networkMembership.upsert({
        where: { stripeSubscriptionId: sub.id },
        create: {
          userId: customer.userId,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0].price.id,
          stripeCustomerId: sub.customer as string,
          status: sub.status,
          currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        update: {
          status: sub.status,
          currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });

      await writeAuditLog({
        userId: customer.userId,
        action: `STRIPE_SUBSCRIPTION_${event.type.split(".")[2].toUpperCase()}`,
        entityType: "subscription",
        entityId: sub.id,
        metadata: { status: sub.status },
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.networkMembership.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: "canceled" },
      });
      break;
    }
  }
}
