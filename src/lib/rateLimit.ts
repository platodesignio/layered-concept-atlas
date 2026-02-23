import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "siwe:nonce": { windowMs: 60_000, max: 10 },
  "siwe:verify": { windowMs: 60_000, max: 10 },
  "vote": { windowMs: 60_000, max: 5 },
  "flag": { windowMs: 3_600_000, max: 20 },
  "feedback": { windowMs: 60_000, max: 10 },
  "search": { windowMs: 60_000, max: 30 },
  "friend:request": { windowMs: 3_600_000, max: 30 },
  "message:send": { windowMs: 60_000, max: 60 },
};

export async function rateLimit(
  req: NextRequest,
  endpoint: string,
  userId?: string | null
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const config = RATE_LIMITS[endpoint] ?? { windowMs: 60_000, max: 60 };
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = userId ? `user:${userId}:${endpoint}` : `ip:${ip}:${endpoint}`;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + config.windowMs);

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowEnd < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowEnd },
      update: { count: 1, windowEnd },
    });
    return { allowed: true, remaining: config.max - 1, resetAt: windowEnd };
  }

  if (existing.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.windowEnd,
    };
  }

  const updated = await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return {
    allowed: true,
    remaining: config.max - updated.count,
    resetAt: existing.windowEnd,
  };
}
