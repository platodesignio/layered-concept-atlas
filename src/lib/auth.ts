import { prisma } from "./prisma";
import { getSession } from "./session";
import { NextResponse } from "next/server";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
};

export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true },
  });
  if (!user) return null;

  return { ...user, isAdmin: isAdminEmail(user.email) };
}

export async function requireUser(): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  if (!user.isAdmin) {
    return NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 });
  }
  return user;
}

export function isAuthUser(value: AuthUser | NextResponse): value is AuthUser {
  return !(value instanceof NextResponse);
}
