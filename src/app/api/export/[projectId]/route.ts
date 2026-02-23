import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { generateProjectPdf } from "@/lib/pdf";
import { createHash } from "crypto";

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "json";

  const project = await prisma.project.findUnique({
    where: { id: params.projectId, isFrozen: false },
    include: {
      owner: { select: { id: true, displayName: true, name: true } },
      stpfNodes: {
        include: {
          linksFrom: { include: { toNode: { select: { id: true, title: true, type: true } } } },
        },
      },
      reports: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        include: { stpfItems: { include: { stpfNode: { select: { id: true, title: true, type: true } } } } },
      },
      _count: { select: { votes: true, supports: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const auditExcerpts = await prisma.auditLog.findMany({
    where: { entityType: "project", entityId: params.projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { action: true, entityType: true, createdAt: true },
  });

  const timelineEvents = await prisma.timelineEvent.findMany({
    where: { projectId: params.projectId, visibility: { in: ["PUBLIC", "NETWORK_ONLY"] } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { kind: true, createdAt: true },
  });

  const jsonData = {
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      tags: project.tags,
      visibility: project.visibility,
      owner: project.owner,
    },
    stpfNodes: project.stpfNodes.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      links: n.linksFrom.map((l) => ({ to: l.toNode.title, linkType: l.linkType })),
    })),
    reports: project.reports.map((r) => ({
      id: r.id,
      versionNumber: r.versionNumber,
      period: { from: r.periodFrom, to: r.periodTo },
      outcomes: r.outcomes,
      progress: r.progress,
      issues: r.issues,
    })),
    votes: project._count.votes,
    supports: project._count.supports,
    auditExcerpts,
    exportedAt: new Date().toISOString(),
  };

  const jsonBytes = Buffer.from(JSON.stringify(jsonData, null, 2), "utf-8");
  const sha256 = createHash("sha256").update(jsonBytes).digest("hex");

  await prisma.exportLog.create({
    data: { projectId: params.projectId, userId: user.id, format, sha256 },
  });
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "EXPORT_GENERATED",
      entityType: "project",
      entityId: params.projectId,
      metadata: { format, sha256 },
    },
  });

  if (format === "pdf") {
    const pdfBytes = await generateProjectPdf(
      {
        projectTitle: project.title,
        projectDescription: project.description,
        generatedAt: new Date().toISOString(),
        voteCount: project._count.votes,
        supportCount: project._count.supports,
        reportSummaries: project.reports.map((r) => ({
          title: `Report v${r.versionNumber}`,
          period: `${r.periodFrom.toISOString().slice(0, 10)} ~ ${r.periodTo.toISOString().slice(0, 10)}`,
          outcomes: r.outcomes,
        })),
        stpfLinks: project.stpfNodes.flatMap((n) =>
          n.linksFrom.map((l) => ({ from: n.title, to: l.toNode.title, linkType: l.linkType }))
        ),
        timelineSummary: timelineEvents.map((e) => `[${e.createdAt.toISOString().slice(0, 10)}] ${e.kind}`),
        auditExcerpts: auditExcerpts.map((a) => ({
          action: a.action,
          entityType: a.entityType,
          createdAt: a.createdAt.toISOString().slice(0, 16),
        })),
        jsonHash: sha256,
      },
      jsonBytes
    );

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="plato-${project.id}-${Date.now()}.pdf"`,
      },
    });
  }

  return new NextResponse(jsonBytes, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="plato-${project.id}-${Date.now()}.json"`,
    },
  });
}
