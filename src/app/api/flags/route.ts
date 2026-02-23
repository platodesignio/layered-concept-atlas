import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";
import { FlagTargetType } from "@prisma/client";

const FlagSchema = z.object({
  targetType: z.nativeEnum(FlagTargetType),
  projectId: z.string().optional(),
  reportId: z.string().optional(),
  commentId: z.string().optional(),
  messageId: z.string().optional(),
  targetUserId: z.string().optional(),
  reason: z.string().min(5).max(500),
  details: z.string().max(2000).optional(),
  desiredAction: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimit(req, "flag", user.id);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await req.json();
  const parsed = FlagSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const flag = await prisma.$transaction(async (tx) => {
    const f = await tx.flag.create({
      data: { reporterId: user.id, ...parsed.data },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "FLAG_SUBMITTED",
        entityType: "flag",
        entityId: f.id,
        metadata: { targetType: parsed.data.targetType },
      },
    });
    return f;
  });

  return NextResponse.json({ flag }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "OPEN";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const [flags, total] = await Promise.all([
    prisma.flag.findMany({
      where: { status: status as "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED" },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reporter: { select: { id: true, displayName: true, name: true, email: true } },
      },
    }),
    prisma.flag.count({ where: { status: status as "OPEN" | "REVIEWING" | "RESOLVED" | "DISMISSED" } }),
  ]);

  return NextResponse.json({ flags, total, page, limit });
}
