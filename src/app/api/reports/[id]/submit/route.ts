import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (report.authorId !== user.id && user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (report.status !== "DRAFT") {
    return NextResponse.json({ error: "Only DRAFT reports can be submitted" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.report.update({
      where: { id },
      data: { status: "PENDING_APPROVAL" },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "REPORT_SUBMITTED",
        entityType: "report",
        entityId: r.id,
      },
    });
    // Notify project owner
    const project = await tx.project.findUnique({ where: { id: r.projectId } });
    if (project && project.ownerId !== user.id) {
      await tx.notification.create({
        data: {
          userId: project.ownerId,
          kind: "REPORT_PENDING",
          title: "報告の承認依頼が届きました",
          body: "報告が承認待ちです。",
          linkUrl: `/reports/${r.id}`,
        },
      });
    }
    return r;
  });

  return NextResponse.json({ report: updated });
}
