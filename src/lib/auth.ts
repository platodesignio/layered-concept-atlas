import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";

const ADMIN_ALLOWLIST = (process.env.ADMIN_EMAIL_ALLOWLIST || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL || "noreply@example.com",
      name: "Plato Pre-Review Engine",
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isAdmin: true, adminRole: true },
        });
        const u = session.user as typeof session.user & {
          isAdmin: boolean;
          adminRole: string | null;
        };
        u.isAdmin = dbUser?.isAdmin ?? false;
        u.adminRole = dbUser?.adminRole ?? null;
      }
      return session;
    },
    async signIn({ user }) {
      if (!user.email) return false;
      if (ADMIN_ALLOWLIST.includes(user.email)) {
        await prisma.user
          .update({
            where: { email: user.email },
            data: { isAdmin: true, adminRole: "admin" },
          })
          .catch(() => null);
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
  },
});

export function isAdminEmail(email: string): boolean {
  return ADMIN_ALLOWLIST.includes(email);
}
