import Stripe from "stripe";

// Lazily validate at runtime (not at build time) so Vercel build doesn't fail
// when env vars are only set in the production environment.
function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
}

// Use a module-level singleton that is created lazily
let _stripe: Stripe | null = null;
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    if (!_stripe) _stripe = getStripeClient();
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  creator: {
    priceId: process.env.STRIPE_CREATOR_PRICE_ID ?? "",
    name: "Creator",
    nameJa: "クリエイター",
    price: 980,
    description: "思考の蓄積を解放する",
  },
  axis: {
    priceId: process.env.STRIPE_AXIS_PRICE_ID ?? "",
    name: "Axis",
    nameJa: "アクシス",
    price: 2980,
    description: "評価軸の所有を解放する",
  },
} as const;

export type PlanKey = keyof typeof PLANS;
