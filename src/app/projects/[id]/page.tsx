import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export default async function ProjectDetailPage({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const session = await auth();
  const { id } = await Promise.resolve(params) as { id: string };
  const project = await prisma.project.findFirst({
    where: { OR: [{ id }, { slug: id }], isFrozen: false },
    include: {
      owner: { select: { id: true, displayName: true, name: true } },
      members: { include: { user: { select: { id: true, displayName: true, name: true } } } },
      stpfNodes: {
        orderBy: { createdAt: "asc" },
        include: {
          linksFrom: { include: { toNode: { select: { id: true, title: true, type: true } } } },
        },
      },
      reports: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 5,
        include: { author: { select: { id: true, displayName: true, name: true } } },
      },
      _count: { select: { votes: true, supports: true, reports: true, follows: true } },
    },
  });

  if (!project) notFound();

  const stpfByType: Record<string, typeof project.stpfNodes> = {
    STRUCTURE_ANALYSIS: [],
    THEORY_NODE: [],
    PAPER: [],
    FIELD_IMPLEMENTATION: [],
  };
  for (const n of project.stpfNodes) {
    stpfByType[n.type]?.push(n);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">{project.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {project.owner.displayName ?? project.owner.name} ·
            <span className="ml-2 border border-gray-300 px-1 text-xs">{project.visibility}</span>
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <Link href={`/api/export/${project.id}?format=json`} className="no-underline border px-2 py-1">JSON</Link>
          <Link href={`/api/export/${project.id}?format=pdf`} className="no-underline border px-2 py-1">PDF</Link>
        </div>
      </div>

      <p className="mb-4">{project.description}</p>

      <div className="flex gap-4 mb-6 text-sm border-t border-b py-3">
        <span>投票 <strong>{project._count.votes}</strong></span>
        <span>支援 <strong>{project._count.supports}</strong></span>
        <span>報告 <strong>{project._count.reports}</strong></span>
        <span>フォロワー <strong>{project._count.follows}</strong></span>
      </div>

      {project.tags.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {project.tags.map((t) => (
            <span key={t} className="text-xs border px-1">{t}</span>
          ))}
        </div>
      )}

      <h2 className="font-bold border-b mb-3 pb-1">STPFノード</h2>
      {(["STRUCTURE_ANALYSIS", "THEORY_NODE", "PAPER", "FIELD_IMPLEMENTATION"] as const).map((type) => {
        const nodes = stpfByType[type] ?? [];
        const label = { STRUCTURE_ANALYSIS: "S: 構造分析", THEORY_NODE: "T: 理論ノード", PAPER: "P: 論文", FIELD_IMPLEMENTATION: "F: 実装" }[type];
        return (
          <div key={type} className="mb-4">
            <h3 className="text-sm font-bold mb-2">{label}</h3>
            {nodes.length === 0 ? (
              <p className="text-sm text-gray-400">なし</p>
            ) : (
              <ul className="text-sm divide-y">
                {nodes.map((n) => (
                  <li key={n.id} className="py-2">
                    <Link href={`/stpf/${n.id}`} className="font-medium">{n.title}</Link>
                    {n.linksFrom.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        → {n.linksFrom.map((l) => `[${l.linkType}] ${l.toNode.title}`).join(", ")}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <div className="flex gap-2 mt-4 mb-6">
        <Link href={`/reports/new?projectId=${project.id}`} className="no-underline bg-black text-white px-3 py-1 text-sm">
          + 報告を作成
        </Link>
        {session && (
          <>
            <button
              onClick={() =>
                fetch("/api/votes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ projectId: project.id }),
                })
              }
              className="border border-black px-3 py-1 text-sm"
            >
              投票する
            </button>
            <Link href={`/wallet?projectId=${project.id}`} className="no-underline border border-black px-3 py-1 text-sm">
              支援する
            </Link>
          </>
        )}
      </div>

      <h2 className="font-bold border-b mb-3 pb-1">公開報告</h2>
      <div className="divide-y">
        {project.reports.map((r) => (
          <div key={r.id} className="py-2">
            <Link href={`/reports/${r.id}`} className="text-sm font-medium">
              v{r.versionNumber} — {formatDate(r.publishedAt)}
            </Link>
            <p className="text-xs text-gray-500 mt-0.5">{r.outcomes.slice(0, 80)}…</p>
          </div>
        ))}
        {project.reports.length === 0 && <p className="text-sm text-gray-400 py-2">報告なし</p>}
      </div>

      {project.receiptAddress && (
        <div className="mt-6 border border-black p-3 text-sm">
          <p className="font-bold mb-1">オンチェーン支援</p>
          <p className="font-mono text-xs">{project.receiptAddress}</p>
          <p className="text-xs text-gray-500 mt-1">Base mainnet (chainId=8453) で ETH を送金後、ウォレットページから tx hash を記録してください。</p>
        </div>
      )}

      <div className="mt-6 border-t pt-4">
        <Link href={`/api/audit?entityType=project&entityId=${project.id}`} className="text-sm">監査ログ</Link>
      </div>
    </div>
  );
}
