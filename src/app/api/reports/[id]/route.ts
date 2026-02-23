import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Visibility } from "@prisma/client";

const UpdateSchema = z.object({
  outcomes: z.string().min(1).max(10000).optional(),
  progress: z.string().min(1).max(10000).optional(),
  issues: z.string().min(1).max(10000).optional(),
  risks: z.string().min(1).max(5000).optional(),
  nextActions: z.string().min(1).max(10000).optional(),
  visibility: z.nativeEnum(Visibility).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, displayName: true, name: true } },
      project: { select: { id: true, title: true, slug: true, ownerId: true } },
      stpfItems: { include: { stpfNode: { select: { id: true, title: true, type: true } } } },
      versions: { orderBy: { versionNumber: "desc" } },
    },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ report });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    include: { project: { select: { ownerId: true } } },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAuthor = report.authorId === user.id;
  const isOwner = report.project.ownerId === user.id;
  const isAdmin = user.role === "NETWORK_ADMIN";
  if (!isAuthor && !isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (report.status !== "DRAFT") {
    return NextResponse.json({ error: "Only DRAFT reports can be edited" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await prisma.report.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ report: updated });
}
