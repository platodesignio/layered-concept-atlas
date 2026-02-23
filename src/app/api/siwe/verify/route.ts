import { NextRequest, NextResponse } from "next/server";
import { parseSiweMessage, validateSiweMessage } from "viem/siwe";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { writeAuditLog } from "@/lib/audit";

const publicClient = createPublicClient({ chain: base, transport: http() });

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, "siwe:verify");
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { message, signature } = body as { message: string; signature: string };
  if (!message || !signature) {
    return NextResponse.json({ error: "message and signature required" }, { status: 400 });
  }

  let siweMsg: ReturnType<typeof parseSiweMessage>;
  try {
    siweMsg = parseSiweMessage(message);
  } catch {
    return NextResponse.json({ error: "Invalid SIWE message" }, { status: 400 });
  }

  if (!siweMsg.nonce || !siweMsg.address) {
    return NextResponse.json({ error: "Invalid SIWE message fields" }, { status: 400 });
  }

  // Nonce check — must exist, be PENDING, and not expired
  const nonceRecord = await prisma.siweNonce.findUnique({
    where: { nonce: siweMsg.nonce },
  });

  if (!nonceRecord) {
    return NextResponse.json({ error: "Nonce not found" }, { status: 400 });
  }
  if (nonceRecord.status !== "PENDING") {
    return NextResponse.json({ error: "Nonce already used or expired" }, { status: 400 });
  }
  if (nonceRecord.expiresAt < new Date()) {
    await prisma.siweNonce.update({ where: { id: nonceRecord.id }, data: { status: "EXPIRED" } });
    return NextResponse.json({ error: "Nonce expired" }, { status: 400 });
  }

  // Domain check
  const expectedDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost";
  if (siweMsg.domain !== expectedDomain) {
    return NextResponse.json({ error: "Domain mismatch" }, { status: 400 });
  }

  // Chain check
  const expectedChainId = parseInt(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID ?? "8453");
  if (siweMsg.chainId !== expectedChainId) {
    return NextResponse.json({ error: "Chain mismatch" }, { status: 400 });
  }

  // Signature verification via viem (no ethers dependency)
  try {
    const isValid = await publicClient.verifySiweMessage({
      message,
      signature: signature as `0x${string}`,
    });
    if (!isValid) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  // Mark nonce as used (replay attack prevention)
  await prisma.siweNonce.update({
    where: { id: nonceRecord.id },
    data: { status: "USED", usedAt: new Date() },
  });

  const walletAddress = siweMsg.address;
  const chainId = siweMsg.chainId!;

  // Attach wallet to user
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { walletAddress },
    });
    await tx.walletConnection.upsert({
      where: { userId_address: { userId: user.id, address: walletAddress } },
      create: { userId: user.id, address: walletAddress, chainId },
      update: { lastSignedAt: new Date(), chainId },
    });
  });

  await writeAuditLog({
    userId: user.id,
    action: "SIWE_VERIFIED",
    entityType: "user",
    entityId: user.id,
    metadata: { address: walletAddress, chainId, purpose: nonceRecord.purpose },
    ipAddress: req.headers.get("x-forwarded-for") ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  return NextResponse.json({ address: walletAddress, chainId });
}
