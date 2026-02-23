import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, "siwe:nonce");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const user = await getSessionUser();
  const body = await req.json().catch(() => ({}));
  const purpose = (body.purpose as string) ?? "wallet_connect";
  const targetId = (body.targetId as string) ?? null;

  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.siweNonce.create({
    data: {
      nonce,
      userId: user?.id ?? null,
      expiresAt,
      status: "PENDING",
      purpose,
      targetId,
    },
  });

  return NextResponse.json({ nonce, expiresAt: expiresAt.toISOString() });
}
