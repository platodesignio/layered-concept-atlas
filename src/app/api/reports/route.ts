import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isProjectMember } from "@/lib/session";
import { Visibility } from "@prisma/client";

const SupportNeedSchema = z.object({
  type: z.enum(["funding", "review", "implementation", "other"]),
  description: z.string().max(500),
});

const CreateSchema = z.object({
  projectId: z.string(),
  periodFrom: z.string().datetime(),
  periodTo: z.string().datetime(),
  outcomes: z.string().min(1).max(10000),
  progress: z.string().min(1).max(10000),
  issues: z.string().min(1).max(10000),
  risks: z.string().min(1).max(5000),
  nextActions: z.string().min(1).max(10000),
  supportNeeds: z.array(SupportNeedSchema).default([]),
  externalLinks: z.array(z.string().url()).default([]),
  collaborators: z.array(z.string()).default([]),
  stpfItems: z
    .array(z.object({ stpfNodeId: z.string(), action: z.string().max(500) }))
    .default([]),
  visibility: z.nativeEnum(Visibility).default("PROJECT_ONLY"),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (projectId) where.projectId = projectId;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, displayName: true, name: true } },
        project: { select: { id: true, title: true, slug: true } },
        stpfItems: {
          include: { stpfNode: { select: { id: true, type: true, title: true } } },
        },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return NextResponse.json({ reports, total, page, limit });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;
  const isMember = await isProjectMember(user.id, data.projectId);
  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!isMember && project.ownerId !== user.id && user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const report = await prisma.$transaction(async (tx) => {
    const r = await tx.report.create({
      data: {
        projectId: data.projectId,
        authorId: user.id,
        status: "DRAFT",
        visibility: data.visibility,
        periodFrom: new Date(data.periodFrom),
        periodTo: new Date(data.periodTo),
        outcomes: data.outcomes,
        progress: data.progress,
        issues: data.issues,
        risks: data.risks,
        nextActions: data.nextActions,
        supportNeeds: data.supportNeeds,
        externalLinks: data.externalLinks,
        collaborators: data.collaborators,
      },
    });
    for (const item of data.stpfItems) {
      await tx.reportStpfItem.create({
        data: { reportId: r.id, stpfNodeId: item.stpfNodeId, action: item.action },
      });
    }
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "REPORT_CREATED",
        entityType: "report",
        entityId: r.id,
        metadata: { projectId: data.projectId },
      },
    });
    return r;
  });

  return NextResponse.json({ report }, { status: 201 });
}
