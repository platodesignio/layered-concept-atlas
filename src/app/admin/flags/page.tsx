import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function AdminFlagsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (dbUser?.role !== "NETWORK_ADMIN") redirect("/");

  const flags = await prisma.flag.findMany({
    where: { status: { in: ["OPEN", "REVIEWING"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { reporter: { select: { id: true, displayName: true, email: true } } },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">通報処理</h1>
        <Link href="/admin" className="no-underline text-sm border px-2 py-1">← 管理画面</Link>
      </div>
      <div className="divide-y">
        {flags.map((f) => (
          <div key={f.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">[{f.targetType}] {f.reason}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  通報者: {f.reporter.displayName ?? f.reporter.email} ·
                  {formatDateTime(f.createdAt)} ·
                  状態: {f.status}
                </p>
                {f.details && <p className="text-xs mt-1">{f.details}</p>}
              </div>
              <div className="flex flex-col gap-1">
                {f.targetType === "DM_MESSAGE" && f.messageId && (
                  <Link href={`/admin/flags/${f.id}/dm`} className="no-underline text-xs border px-2 py-0.5">
                    DM閲覧
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
        {flags.length === 0 && <p className="py-4 text-sm text-gray-400">未処理の通報はありません。</p>}
      </div>
    </div>
  );
}
