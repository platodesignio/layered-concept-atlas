/**
 * authz.ts – Capability-based authorization
 *
 * Capabilities:
 *   concept:write      – 自分の概念を作成・編集
 *   concept:private    – プライベート概念の所有
 *   run:persist        – 分析Runの永続保存
 *   pack:write         – ConceptPack の作成・管理
 *   dictionary:write   – ユーザー辞書の追加・編集
 *   mapping:write      – ユーザー写像ルールの追加・編集
 *   layerdef:write     – レイヤー定義の説明文編集
 *   admin:*            – 全権限
 */

import { prisma } from "./prisma";

export type Capability =
  | "concept:write"
  | "concept:private"
  | "run:persist"
  | "pack:write"
  | "dictionary:write"
  | "mapping:write"
  | "layerdef:write"
  | "admin:*";

export const PLAN_CAPABILITIES: Record<string, Capability[]> = {
  FREE: [],
  CREATOR: ["concept:write", "concept:private", "run:persist", "pack:write"],
  AXIS: [
    "concept:write",
    "concept:private",
    "run:persist",
    "pack:write",
    "dictionary:write",
    "mapping:write",
    "layerdef:write",
  ],
};

/** ユーザーの capabilities を返す（キャッシュなし・常に最新） */
export async function getCapabilities(userId: string): Promise<Capability[]> {
  // Admin check
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return [];

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.includes(user.email.toLowerCase())) {
    return ["admin:*"];
  }

  // Entitlement from DB
  const entitlement = await prisma.entitlement.findUnique({
    where: { userId },
  });
  if (entitlement) {
    return entitlement.capabilities as Capability[];
  }

  // Subscription fallback
  const sub = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (sub && (sub.status === "active" || sub.status === "trialing")) {
    const plan = sub.plan as keyof typeof PLAN_CAPABILITIES;
    return PLAN_CAPABILITIES[plan] ?? [];
  }

  return [];
}

/** 単一capability確認 */
export async function can(userId: string, capability: Capability): Promise<boolean> {
  const caps = await getCapabilities(userId);
  return caps.includes("admin:*") || caps.includes(capability);
}

/** 複数capability確認（全て必要） */
export async function canAll(userId: string, capabilities: Capability[]): Promise<boolean> {
  const caps = await getCapabilities(userId);
  if (caps.includes("admin:*")) return true;
  return capabilities.every((c) => caps.includes(c));
}

/** Entitlementを更新（Webhook・管理から呼ぶ） */
export async function setEntitlement(
  userId: string,
  capabilities: Capability[],
  source: "system" | "subscription" | "admin" = "subscription"
): Promise<void> {
  await prisma.entitlement.upsert({
    where: { userId },
    update: { capabilities, source, updatedAt: new Date() },
    create: { userId, capabilities, source, updatedAt: new Date() },
  });
}

/** プラン名から capabilities を取得 */
export function capabilitiesForPlan(plan: string): Capability[] {
  return PLAN_CAPABILITIES[plan.toUpperCase()] ?? [];
}
