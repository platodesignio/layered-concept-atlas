import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, getProjectRole } from "@/lib/session";
import { canApproveReport } from "@/lib/authz";

const RejectSchema = z.object({ reason: z.string().min(5).max(1000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.report.findUnique({ where: { id: params.id } });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (report.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "Not pending approval" }, { status: 400 });
  }

  const projectRole = await getProjectRole(user.id, report.projectId);
  if (!canApproveReport(user.role, projectRole === "PROJECT_OWNER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = RejectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.$transaction(async (tx) => {
    const r = await tx.report.update({
      where: { id: params.id },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectedReason: parsed.data.reason },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "REPORT_REJECTED",
        entityType: "report",
        entityId: r.id,
        metadata: { reason: parsed.data.reason },
      },
    });
    return r;
  });

  return NextResponse.json({ report: updated });
}
