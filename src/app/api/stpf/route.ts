import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isProjectMember } from "@/lib/session";
import { StpfType } from "@prisma/client";

const StructureAnalysisContent = z.object({
  subject: z.string(),
  assumptions: z.array(z.string()),
  dependencies: z.array(z.string()),
  failurePatterns: z.array(z.string()),
  metrics: z.array(z.string()),
  falsificationConditions: z.array(z.string()),
  nextConstraints: z.string(),
});

const TheoryNodeContent = z.object({
  proposition: z.string(),
  conceptDict: z.record(z.string()),
  predictions: z.array(z.string()),
  falsificationConditions: z.array(z.string()),
  requiredExperiments: z.array(z.string()),
  references: z.array(z.string()),
  linkedSIds: z.array(z.string()),
});

const PaperContent = z.object({
  chapters: z.array(z.object({ title: z.string(), body: z.string() })),
  citations: z.array(z.string()),
  version: z.string(),
  anticipatedObjections: z.array(z.object({ objection: z.string(), response: z.string() })),
  publicationTarget: z.string().optional(),
});

const FieldImplementationContent = z.object({
  repoUrl: z.string().url().optional(),
  deployUrl: z.string().url().optional(),
  releaseNotes: z.string(),
  operationLogs: z.array(z.string()),
  incidents: z.array(z.string()),
  cost: z.string().optional(),
  feedbackSummary: z.string(),
  learnings: z.string(),
  linkedPaperVersion: z.string().optional(),
});

const contentSchemas: Record<StpfType, z.ZodTypeAny> = {
  STRUCTURE_ANALYSIS: StructureAnalysisContent,
  THEORY_NODE: TheoryNodeContent,
  PAPER: PaperContent,
  FIELD_IMPLEMENTATION: FieldImplementationContent,
};

const CreateSchema = z.object({
  projectId: z.string(),
  type: z.nativeEnum(StpfType),
  title: z.string().min(2).max(300),
  content: z.record(z.unknown()),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const nodes = await prisma.stpfNode.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, displayName: true, name: true } },
      linksFrom: { include: { toNode: { select: { id: true, title: true, type: true } } } },
      linksTo: { include: { fromNode: { select: { id: true, title: true, type: true } } } },
    },
  });

  return NextResponse.json({ nodes });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { projectId, type, title, content } = parsed.data;

  const isMember = await isProjectMember(user.id, projectId);
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!isMember && project.ownerId !== user.id && user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate content against type-specific schema
  const contentSchema = contentSchemas[type];
  const contentParsed = contentSchema.safeParse(content);
  if (!contentParsed.success) {
    return NextResponse.json({ error: contentParsed.error.flatten() }, { status: 400 });
  }

  const node = await prisma.$transaction(async (tx) => {
    const n = await tx.stpfNode.create({
      data: { projectId, type, title, content: JSON.parse(JSON.stringify(contentParsed.data)), authorId: user.id },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "STPF_NODE_CREATED",
        entityType: "stpf_node",
        entityId: n.id,
        metadata: { type, title, projectId },
      },
    });
    await tx.timelineEvent.create({
      data: {
        kind: "STPF_NODE_CREATED",
        actorId: user.id,
        projectId,
        stpfNodeId: n.id,
        visibility: "NETWORK_ONLY",
      },
    });
    return n;
  });

  return NextResponse.json({ node }, { status: 201 });
}
