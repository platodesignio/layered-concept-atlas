import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getProjectRole } from "@/lib/session";
import { canApproveReport } from "@/lib/authz";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (report.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "Report is not pending approval" }, { status: 400 });
  }

  const projectRole = await getProjectRole(user.id, report.projectId);
  const isProjectOwner = projectRole === "PROJECT_OWNER";
  if (!canApproveReport(user.role, isProjectOwner)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.report.update({
      where: { id },
      data: { status: "PUBLISHED", approverId: user.id, publishedAt: new Date() },
    });
    // Save version snapshot
    await tx.reportVersion.create({
      data: {
        reportId: r.id,
        versionNumber: r.versionNumber,
        snapshotJson: JSON.parse(JSON.stringify(r)),
        revisionReason: "Initial publication",
        createdById: user.id,
      },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "REPORT_APPROVED",
        entityType: "report",
        entityId: r.id,
      },
    });
    await tx.timelineEvent.create({
      data: {
        kind: "REPORT_PUBLISHED",
        actorId: user.id,
        projectId: r.projectId,
        reportId: r.id,
        visibility: r.visibility === "PUBLIC" ? "PUBLIC" : "NETWORK_ONLY",
      },
    });
    return r;
  });

  return NextResponse.json({ report: updated });
}
