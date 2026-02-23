import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { rateLimit } from "@/lib/rateLimit";

const FeedbackSchema = z.object({
  executionId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  pagePath: z.string().max(500).optional(),
  url: z.string().max(1000).optional(),
  context: z
    .object({
      operationHistory: z.array(z.string()).optional(),
      targetObjectId: z.string().optional(),
      walletConnected: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  const rl = await rateLimit(req, "feedback", user?.id);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const body = await req.json();
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const userAgent = req.headers.get("user-agent") ?? null;
  const feedback = await prisma.feedback.create({
    data: {
      ...parsed.data,
      userId: user?.id ?? null,
      userAgent,
    },
  });

  return NextResponse.json({ feedback }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "open";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where: { status },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, displayName: true, email: true } } },
    }),
    prisma.feedback.count({ where: { status } }),
  ]);

  return NextResponse.json({ feedbacks, total, page, limit });
}
