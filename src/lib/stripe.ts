import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
  typescript: true,
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
