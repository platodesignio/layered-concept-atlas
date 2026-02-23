import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getTopProjects() {
  return prisma.project.findMany({
    where: { isFrozen: false, visibility: { in: ["PUBLIC", "NETWORK_ONLY"] } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      owner: { select: { id: true, displayName: true, name: true } },
      _count: { select: { votes: true, supports: true, reports: true } },
    },
  });
}

export default async function HomePage() {
  const projects = await getTopProjects();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-2">Plato Network</h1>
      <p className="mb-6 text-sm">
        STPF CYCLE（Structure Analysis → Theory Node → Paper → Field Implementation）が因果リンクで接続された自走型研究ネットワーク。
        研究は終点ではなく出発点、プロダクトは成果ではなく次の理論を生む観測装置である。
      </p>

      <div className="mb-4 flex gap-3">
        <Link href="/projects" className="no-underline border border-black px-3 py-1 text-sm">
          プロジェクト一覧
        </Link>
        <Link href="/projects/new" className="no-underline bg-black text-white px-3 py-1 text-sm">
          + プロジェクト作成
        </Link>
        <Link href="/timeline" className="no-underline border border-black px-3 py-1 text-sm">
          タイムライン
        </Link>
      </div>

      <h2 className="font-bold mb-3 border-b border-black pb-1">最新プロジェクト</h2>
      <div className="divide-y divide-gray-200">
        {projects.map((p) => (
          <div key={p.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/projects/${p.id}`} className="font-medium">
                  {p.title}
                </Link>
                <p className="text-sm text-gray-600 mt-0.5">{p.description.slice(0, 100)}…</p>
                <p className="text-xs mt-1 text-gray-400">
                  {p.owner.displayName ?? p.owner.name} ·
                  投票 {p._count.votes} · 支援 {p._count.supports} · 報告 {p._count.reports}
                </p>
              </div>
              <span className="text-xs border border-gray-300 px-1 whitespace-nowrap">{p.visibility}</span>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="py-4 text-sm text-gray-500">プロジェクトがまだありません。</p>
        )}
      </div>
    </div>
  );
}
