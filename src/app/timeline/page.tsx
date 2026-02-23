import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

interface Props {
  searchParams: { filter?: string; cursor?: string };
}

const EVENT_LABELS: Record<string, string> = {
  PROJECT_CREATED: "プロジェクトを作成",
  PROJECT_UPDATED: "プロジェクトを更新",
  STPF_NODE_CREATED: "STPFノードを追加",
  REPORT_PUBLISHED: "報告を公開",
  VOTE_CAST: "投票",
  SUPPORT_ONCHAIN: "オンチェーン支援",
  SUPPORT_STRIPE: "会費支援",
  FRIEND_ACCEPTED: "友達になりました",
  FOLLOW_ADDED: "プロジェクトをフォロー",
  COMMENT_ADDED: "コメント",
  REPORT_REVISED: "報告を改訂",
};

export default async function TimelinePage({ searchParams }: Props) {
  const session = await auth();
  const filter = searchParams.filter ?? "Network";
  const cursor = searchParams.cursor;
  const limit = 20;

  const visibilities = session
    ? ["PUBLIC", "NETWORK_ONLY"] as const
    : ["PUBLIC"] as const;

  const where: Record<string, unknown> = {
    visibility: { in: visibilities },
    ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
  };

  const events = await prisma.timelineEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      actor: { select: { id: true, displayName: true, name: true } },
      project: { select: { id: true, title: true } },
      report: { select: { id: true } },
    },
  });

  const nextCursor = events.length === limit
    ? events[events.length - 1].createdAt.toISOString()
    : null;

  const filters = ["Network", "Friends", "ProjectsFollowed", "Self"];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">タイムライン</h1>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f}
            href={`/timeline?filter=${f}`}
            className={`no-underline border px-3 py-1 text-sm ${filter === f ? "bg-black text-white" : "border-black"}`}
          >
            {f}
          </Link>
        ))}
      </div>

      <div className="divide-y">
        {events.map((e) => (
          <div key={e.id} className="py-3">
            <p className="text-sm">
              <span className="font-medium">{e.actor.displayName ?? e.actor.name}</span>
              {" "}
              <span>{EVENT_LABELS[e.kind] ?? e.kind}</span>
              {e.project && (
                <> — <Link href={`/projects/${e.project.id}`}>{e.project.title}</Link></>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(e.createdAt)}</p>
          </div>
        ))}
        {events.length === 0 && <p className="text-sm text-gray-400 py-4">イベントがありません。</p>}
      </div>

      {nextCursor && (
        <div className="mt-4">
          <Link
            href={`/timeline?filter=${filter}&cursor=${nextCursor}`}
            className="no-underline border border-black px-3 py-1 text-sm"
          >
            さらに読み込む
          </Link>
        </div>
      )}
    </div>
  );
}
