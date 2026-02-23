import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) redirect("/auth/signin");

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== "NETWORK_ADMIN") redirect("/");

  const [openFlags, openFeedbacks, totalUsers, frozenUsers] = await Promise.all([
    prisma.flag.count({ where: { status: "OPEN" } }),
    prisma.feedback.count({ where: { status: "open" } }),
    prisma.user.count(),
    prisma.user.count({ where: { isFrozen: true } }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6">管理画面</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-black p-4">
          <p className="text-2xl font-bold">{openFlags}</p>
          <p className="text-sm">未処理の通報</p>
        </div>
        <div className="border border-black p-4">
          <p className="text-2xl font-bold">{openFeedbacks}</p>
          <p className="text-sm">未対応フィードバック</p>
        </div>
        <div className="border border-black p-4">
          <p className="text-2xl font-bold">{totalUsers}</p>
          <p className="text-sm">総ユーザー数</p>
        </div>
        <div className="border border-black p-4">
          <p className="text-2xl font-bold">{frozenUsers}</p>
          <p className="text-sm">凍結ユーザー</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link href="/admin/flags" className="no-underline border border-black px-4 py-2 text-sm">通報処理</Link>
        <Link href="/admin/feedback" className="no-underline border border-black px-4 py-2 text-sm">フィードバック</Link>
        <Link href="/admin/audit" className="no-underline border border-black px-4 py-2 text-sm">監査ログ</Link>
        <Link href="/admin/users" className="no-underline border border-black px-4 py-2 text-sm">ユーザー管理</Link>
      </div>
    </div>
  );
}
