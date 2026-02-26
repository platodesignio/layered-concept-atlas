import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

interface Props {
  searchParams: Promise<{ entityType?: string; action?: string; page?: string }>;
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (dbUser?.role !== "NETWORK_ADMIN") redirect("/");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const limit = 50;

  const where: Record<string, unknown> = {};
  if (sp.entityType) where.entityType = sp.entityType;
  if (sp.action) where.action = { contains: sp.action, mode: "insensitive" };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, displayName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">監査ログ ({total})</h1>
        <Link href="/admin" className="no-underline text-sm border px-2 py-1">← 管理画面</Link>
      </div>

      <form className="flex gap-2 mb-4">
        <input name="entityType" defaultValue={sp.entityType} placeholder="エンティティ種別" className="border px-2 py-1 text-sm" />
        <input name="action" defaultValue={sp.action} placeholder="アクション" className="border px-2 py-1 text-sm" />
        <button type="submit" className="bg-black text-white px-3 py-1 text-sm">絞込</button>
      </form>

      <div className="text-xs font-mono divide-y border">
        {logs.map((l) => (
          <div key={l.id} className="px-3 py-2 grid grid-cols-5 gap-2">
            <span className="text-gray-400">{formatDateTime(l.createdAt)}</span>
            <span>{l.user?.displayName ?? l.user?.email ?? "—"}</span>
            <span className="font-bold">{l.action}</span>
            <span className="text-gray-500">{l.entityType}/{l.entityId.slice(0, 8)}</span>
            <span className="truncate text-gray-400">{JSON.stringify(l.metadata)}</span>
          </div>
        ))}
      </div>

      {Math.ceil(total / limit) > 1 && (
        <div className="flex gap-2 mt-4 text-sm">
          {page > 1 && <Link href={`?page=${page - 1}`} className="no-underline border px-2 py-1">前へ</Link>}
          <span className="px-2 py-1">{page} / {Math.ceil(total / limit)}</span>
          {page < Math.ceil(total / limit) && <Link href={`?page=${page + 1}`} className="no-underline border px-2 py-1">次へ</Link>}
        </div>
      )}
    </div>
  );
}
