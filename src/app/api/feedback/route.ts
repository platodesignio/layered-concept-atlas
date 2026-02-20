import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { requireAdmin, isAuthUser } from "@/lib/auth";

const createSchema = z.object({
  runId: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

  const [total, feedbacks] = await Promise.all([
    prisma.feedback.count(),
    prisma.feedback.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        run: { select: { runType: true } },
      },
    }),
  ]);

  return NextResponse.json({ feedbacks, total, page, limit });
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, "feedback");
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const user = await getCurrentUser();
  const feedback = await prisma.feedback.create({
    data: {
      runId: parsed.data.runId ?? null,
      userId: user?.id ?? null,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
    },
  });

  return NextResponse.json(feedback, { status: 201 });
}
