import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canEditReport } from "@/lib/authz";

const ReviseSchema = z.object({
  revisionReason: z.string().min(10).max(1000),
  outcomes: z.string().min(1).max(10000).optional(),
  progress: z.string().min(1).max(10000).optional(),
  issues: z.string().min(1).max(10000).optional(),
  risks: z.string().min(1).max(5000).optional(),
  nextActions: z.string().min(1).max(10000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.report.findUnique({
    where: { id },
    include: { stpfItems: true },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId: report.projectId, userId: user.id } },
  });

  if (!canEditReport(user.role, !!member, report.authorId === user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = ReviseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { revisionReason, ...updateFields } = parsed.data;

  // Save current version snapshot before updating
  const newVersion = report.versionNumber + 1;
  const revised = await prisma.$transaction(async (tx) => {
    // Snapshot current state
    await tx.reportVersion.create({
      data: {
        reportId: report.id,
        versionNumber: report.versionNumber,
        snapshotJson: JSON.parse(JSON.stringify(report)),
        revisionReason,
        createdById: user.id,
      },
    });
    // Update report — reset to pending if already published
    const r = await tx.report.update({
      where: { id },
      data: {
        ...updateFields,
        versionNumber: newVersion,
        revisionReason,
        status: report.status === "PUBLISHED" ? "PENDING_APPROVAL" : report.status,
        publishedAt: report.status === "PUBLISHED" ? null : report.publishedAt,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "REPORT_REVISED",
        entityType: "report",
        entityId: r.id,
        metadata: { revisionReason, newVersion },
      },
    });
    return r;
  });

  return NextResponse.json({ report: revised });
}
