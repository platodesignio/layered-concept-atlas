import { prisma } from "./prisma";
import { NextRequest, NextResponse } from "next/server";

const MAX = parseInt(process.env.RATE_LIMIT_MAX ?? "60");
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");

export async function checkRateLimit(
  req: NextRequest,
  endpoint: string
): Promise<NextResponse | null> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const now = new Date();
  const windowEnd = new Date(now.getTime() + WINDOW_MS);

  try {
    const existing = await prisma.rateLimit.findUnique({
      where: { ip_endpoint: { ip, endpoint } },
    });

    if (!existing || existing.windowEnd < now) {
      await prisma.rateLimit.upsert({
        where: { ip_endpoint: { ip, endpoint } },
        update: { count: 1, windowEnd },
        create: { ip, endpoint, count: 1, windowEnd },
      });
      return null;
    }

    if (existing.count >= MAX) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらく後でお試しください。" },
        { status: 429 }
      );
    }

    await prisma.rateLimit.update({
      where: { ip_endpoint: { ip, endpoint } },
      data: { count: { increment: 1 } },
    });
    return null;
  } catch (e) {
    console.error("Rate limit check failed:", e);
    return null;
  }
}
