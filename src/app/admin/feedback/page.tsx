import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function AdminFeedbackPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (dbUser?.role !== "NETWORK_ADMIN") redirect("/");

  const feedbacks = await prisma.feedback.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { id: true, displayName: true, email: true } } },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">フィードバック</h1>
        <Link href="/admin" className="no-underline text-sm border px-2 py-1">← 管理画面</Link>
      </div>
      <div className="divide-y">
        {feedbacks.map((f) => (
          <div key={f.id} className="py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm">★{f.rating} · {f.user?.displayName ?? f.user?.email ?? "匿名"}</p>
                <p className="text-xs text-gray-400">{f.pagePath} · {formatDateTime(f.createdAt)}</p>
                {f.comment && <p className="text-sm mt-1">{f.comment}</p>}
                <p className="text-xs text-gray-400 font-mono mt-0.5">executionId: {f.executionId}</p>
              </div>
            </div>
          </div>
        ))}
        {feedbacks.length === 0 && <p className="py-4 text-sm text-gray-400">フィードバックなし</p>}
      </div>
    </div>
  );
}
