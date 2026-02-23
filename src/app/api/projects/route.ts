import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { writeAuditLog } from "@/lib/audit";
import { Visibility } from "@prisma/client";

const CreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  tags: z.array(z.string()).max(10).default([]),
  visibility: z.nativeEnum(Visibility).default("NETWORK_ONLY"),
  receiptAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;
  const tag = searchParams.get("tag") ?? undefined;
  const visibility = searchParams.get("visibility") as Visibility | null;

  const where: Record<string, unknown> = {
    isFrozen: false,
    visibility: visibility ?? { in: ["PUBLIC", "NETWORK_ONLY", "LINK_ONLY"] },
  };
  if (tag) {
    where.tags = { has: tag };
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, displayName: true, name: true } },
        _count: { select: { votes: true, supports: true, reports: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return NextResponse.json({ projects, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.isFrozen) return NextResponse.json({ error: "Account frozen" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;

  const project = await prisma.$transaction(async (tx) => {
    const p = await tx.project.create({
      data: {
        slug,
        title: data.title,
        description: data.description,
        tags: data.tags,
        visibility: data.visibility,
        ownerId: user.id,
        receiptAddress: data.receiptAddress,
      },
    });
    await tx.projectMember.create({
      data: { projectId: p.id, userId: user.id, role: "PROJECT_OWNER" },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "PROJECT_CREATED",
        entityType: "project",
        entityId: p.id,
        metadata: { title: data.title, visibility: data.visibility },
      },
    });
    await tx.timelineEvent.create({
      data: {
        kind: "PROJECT_CREATED",
        actorId: user.id,
        projectId: p.id,
        visibility: "NETWORK_ONLY",
      },
    });
    return p;
  });

  return NextResponse.json({ project }, { status: 201 });
}
