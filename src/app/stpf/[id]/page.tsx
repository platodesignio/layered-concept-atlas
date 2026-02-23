import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

interface Props { params: { id: string } }

export default async function StpfDetailPage({ params }: Props) {
  const node = await prisma.stpfNode.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { id: true, displayName: true, name: true } },
      project: { select: { id: true, title: true, slug: true } },
      linksFrom: { include: { toNode: { select: { id: true, title: true, type: true } } } },
      linksTo: { include: { fromNode: { select: { id: true, title: true, type: true } } } },
    },
  });
  if (!node) notFound();

  const typeLabel: Record<string, string> = {
    STRUCTURE_ANALYSIS: "S: 構造分析",
    THEORY_NODE: "T: 理論ノード",
    PAPER: "P: 論文",
    FIELD_IMPLEMENTATION: "F: 実装",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <p className="text-sm text-gray-500 mb-1">
        <Link href={`/projects/${node.project.id}`}>{node.project.title}</Link>
        {" > "}
        {typeLabel[node.type]}
      </p>
      <h1 className="text-xl font-bold mb-4">{node.title}</h1>
      <p className="text-sm text-gray-400 mb-6">
        作成: {formatDateTime(node.createdAt)} · {node.author.displayName ?? node.author.name}
      </p>

      <h2 className="font-bold mb-2">内容</h2>
      <pre className="bg-gray-50 border p-4 text-sm overflow-auto mb-6 whitespace-pre-wrap">
        {JSON.stringify(node.content, null, 2)}
      </pre>

      {node.linksFrom.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold mb-2">このノードから</h2>
          <ul className="text-sm divide-y">
            {node.linksFrom.map((l) => (
              <li key={l.id} className="py-1">
                [{l.linkType}] →{" "}
                <Link href={`/stpf/${l.toNode.id}`}>{l.toNode.title}</Link>
                <span className="text-xs text-gray-400 ml-2">({l.toNode.type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {node.linksTo.length > 0 && (
        <div className="mb-4">
          <h2 className="font-bold mb-2">このノードへ</h2>
          <ul className="text-sm divide-y">
            {node.linksTo.map((l) => (
              <li key={l.id} className="py-1">
                <Link href={`/stpf/${l.fromNode.id}`}>{l.fromNode.title}</Link>
                <span className="text-xs text-gray-400 ml-2">({l.fromNode.type})</span>
                {" "} [{l.linkType}] →
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
