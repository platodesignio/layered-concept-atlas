export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { setEntitlement, capabilitiesForPlan } from "@/lib/authz";
import { createAuditLog } from "@/lib/audit";

// Stripe requires the raw body for signature verification.
// Next.js App Router gives us the raw Request, so we read it as text.
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.billingEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing?.processedAt) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Record receipt
  await prisma.billingEvent.upsert({
    where: { stripeEventId: event.id },
    update: {},
    create: {
      stripeEventId: event.id,
      type: event.type,
      payloadJson: JSON.parse(rawBody) as object,
    },
  });

  let processResult = "ok";

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpsert(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        // Not handling this event type
        break;
    }
  } catch (err) {
    console.error(`[webhook] Error processing ${event.type}:`, err);
    processResult = `error:${String(err)}`;
  }

  // Mark as processed
  await prisma.billingEvent.update({
    where: { stripeEventId: event.id },
    data: { processedAt: new Date(), processResult },
  });

  return NextResponse.json({ ok: true });
}

async function getUserIdFromCustomer(stripeCustomerId: string): Promise<string | null> {
  const cust = await prisma.stripeCustomer.findUnique({
    where: { stripeCustomerId },
  });
  return cust?.userId ?? null;
}

function planFromPriceId(priceId: string): string {
  const creatorPriceId = process.env.STRIPE_CREATOR_PRICE_ID ?? "";
  const axisPriceId = process.env.STRIPE_AXIS_PRICE_ID ?? "";
  if (priceId === creatorPriceId) return "CREATOR";
  if (priceId === axisPriceId) return "AXIS";
  return "FREE";
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== "subscription") return;

  const userId = session.metadata?.userId;
  if (!userId) return;

  // Subscription will be handled by customer.subscription.created
  await createAuditLog({
    userId,
    action: "CHECKOUT_COMPLETED",
    entityType: "Billing",
    entityId: session.id,
    diff: { plan: session.metadata?.plan },
  });
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const userId = await getUserIdFromCustomer(customerId);
  if (!userId) return;

  const priceId = sub.items.data[0]?.price.id ?? "";
  const plan = planFromPriceId(priceId);

  await prisma.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { stripeSubscriptionId: sub.id },
      update: {
        userId,
        stripePriceId: priceId,
        status: sub.status,
        plan: plan as "FREE" | "CREATOR" | "AXIS",
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: new Date(),
      },
      create: {
        userId,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status: sub.status,
        plan: plan as "FREE" | "CREATOR" | "AXIS",
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });
  });

  // Update entitlement
  const isActive = sub.status === "active" || sub.status === "trialing";
  const capabilities = isActive ? capabilitiesForPlan(plan) : [];
  await setEntitlement(userId, capabilities, "subscription");

  await createAuditLog({
    userId,
    action: "SUBSCRIPTION_UPSERT",
    entityType: "Billing",
    entityId: sub.id,
    diff: { plan, status: sub.status, capabilities },
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const userId = await getUserIdFromCustomer(customerId);
  if (!userId) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: { status: "canceled", updatedAt: new Date() },
  });

  // Revoke all capabilities → Free
  await setEntitlement(userId, [], "subscription");

  await createAuditLog({
    userId,
    action: "SUBSCRIPTION_DELETED",
    entityType: "Billing",
    entityId: sub.id,
    diff: { status: "canceled" },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const userId = await getUserIdFromCustomer(customerId);
  if (!userId) return;

  // Ensure status is active after successful payment
  if (invoice.subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: { status: "active", updatedAt: new Date() },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const userId = await getUserIdFromCustomer(customerId);
  if (!userId) return;

  if (invoice.subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: invoice.subscription as string },
      data: { status: "past_due", updatedAt: new Date() },
    });
  }

  await createAuditLog({
    userId,
    action: "PAYMENT_FAILED",
    entityType: "Billing",
    entityId: String(invoice.subscription ?? invoice.id),
    diff: { invoiceId: invoice.id },
  });
}
