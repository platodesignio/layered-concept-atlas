import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { runId: string } }
) {
  const run = await prisma.run.findUnique({
    where: { id: params.runId },
    include: { artifacts: true },
  });
  if (!run) {
    return NextResponse.json({ error: "実行結果が見つかりません" }, { status: 404 });
  }

  const result = run.artifacts.reduce(
    (acc, a) => ({ ...acc, [a.key]: a.value }),
    {} as Record<string, unknown>
  );
  return NextResponse.json({ runId: run.id, runType: run.runType, createdAt: run.createdAt, ...result });
}
