import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/utils";

export default async function ReportDetailPage({
  params,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any;
}) {
  const session = await auth();
  const { id } = await Promise.resolve(params) as { id: string };
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, displayName: true, name: true } },
      project: { select: { id: true, title: true, slug: true, ownerId: true } },
      stpfItems: { include: { stpfNode: { select: { id: true, title: true, type: true } } } },
      versions: { orderBy: { versionNumber: "desc" } },
    },
  });
  if (!report) notFound();

  const isOwner = session?.user?.id === report.project.ownerId || session?.user?.id === report.authorId;
  const canApprove = session?.user?.id === report.project.ownerId ||
    (session?.user as Record<string, unknown>)?.role === "NETWORK_ADMIN";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <p className="text-sm text-gray-500 mb-1">
        <Link href={`/projects/${report.project.id}`}>{report.project.title}</Link> &gt; 報告 v{report.versionNumber}
      </p>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">報告 v{report.versionNumber}</h1>
          <p className="text-sm text-gray-400 mt-1">
            {formatDate(report.periodFrom)} 〜 {formatDate(report.periodTo)} ·
            作成: {report.author.displayName ?? report.author.name} ·
            状態: <strong>{report.status}</strong>
          </p>
        </div>
        <span className="text-xs border px-1">{report.visibility}</span>
      </div>

      {report.status === "PENDING_APPROVAL" && canApprove && (
        <form action={`/api/reports/${report.id}/approve`} method="POST" className="mt-4">
          <button type="submit" className="bg-black text-white px-3 py-1 text-sm">承認する</button>
        </form>
      )}

      <div className="mt-6 space-y-5">
        {[
          ["成果", report.outcomes],
          ["進捗", report.progress],
          ["課題", report.issues],
          ["リスク", report.risks],
          ["次のアクション", report.nextActions],
        ].map(([label, content]) => (
          <div key={label}>
            <h2 className="font-bold border-b pb-1 mb-2">{label}</h2>
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          </div>
        ))}

        {Array.isArray(report.supportNeeds) && (report.supportNeeds as Array<{ type: string; description: string }>).length > 0 && (
          <div>
            <h2 className="font-bold border-b pb-1 mb-2">必要支援</h2>
            <ul className="text-sm divide-y">
              {(report.supportNeeds as Array<{ type: string; description: string }>).map((s, i) => (
                <li key={i} className="py-1">
                  <span className="border px-1 text-xs mr-2">{s.type}</span>
                  {s.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.stpfItems.length > 0 && (
          <div>
            <h2 className="font-bold border-b pb-1 mb-2">対象STPFノード</h2>
            <ul className="text-sm divide-y">
              {report.stpfItems.map((item) => (
                <li key={item.id} className="py-1">
                  <Link href={`/stpf/${item.stpfNode.id}`}>{item.stpfNode.title}</Link>
                  <span className="text-xs text-gray-400 ml-2">({item.stpfNode.type})</span>
                  <span className="text-xs ml-2">— {item.action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {report.versions.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold border-b pb-1 mb-2">改訂履歴</h2>
          <ul className="text-sm divide-y">
            {report.versions.map((v) => (
              <li key={v.id} className="py-1">
                v{v.versionNumber} · {formatDateTime(v.createdAt)} — {v.revisionReason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOwner && (
        <div className="mt-4">
          <Link href={`/reports/${report.id}/revise`} className="no-underline border border-black px-3 py-1 text-sm">
            改訂する
          </Link>
        </div>
      )}
    </div>
  );
}
