import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function AdminUsersPage({
  searchParams,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchParams: any;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (dbUser?.role !== "NETWORK_ADMIN") redirect("/");

  const sp: { page?: string } = await Promise.resolve(searchParams);
  const page = Math.max(1, parseInt(sp.page ?? "1"));
  const limit = 50;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isFrozen: true,
        createdAt: true,
        networkMembership: { select: { status: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">ユーザー管理 ({total})</h1>
        <Link href="/admin" className="no-underline text-sm border px-2 py-1">← 管理画面</Link>
      </div>
      <div className="text-sm divide-y border">
        {users.map((u) => (
          <div key={u.id} className="px-3 py-2 flex items-center justify-between gap-2">
            <div>
              <span className="font-medium">{u.displayName ?? u.email}</span>
              <span className="text-xs text-gray-400 ml-2">{u.email}</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-xs border px-1">{u.role}</span>
              {u.networkMembership?.status === "active" && <span className="text-xs border px-1">会員</span>}
              {u.isFrozen && <span className="text-xs border px-1 text-red-600">凍結</span>}
              <form action="/api/admin/freeze" method="POST">
                <input type="hidden" name="targetType" value="user" />
                <input type="hidden" name="targetId" value={u.id} />
                <input type="hidden" name="freeze" value={u.isFrozen ? "false" : "true"} />
                <button
                  type="submit"
                  className="text-xs border px-2 py-0.5"
                  onClick={(e) => {
                    const reason = prompt("凍結理由を入力してください（10文字以上）");
                    if (!reason || reason.length < 10) { e.preventDefault(); return; }
                    (e.currentTarget.form as HTMLFormElement).append(
                      Object.assign(document.createElement("input"), { type: "hidden", name: "reason", value: reason })
                    );
                  }}
                >
                  {u.isFrozen ? "解除" : "凍結"}
                </button>
              </form>
            </div>
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
