import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM!,
      apiKey: process.env.RESEND_API_KEY!,
      name: "Email",
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // Fetch role from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, isFrozen: true, displayName: true, walletAddress: true },
        });
        if (dbUser) {
          const u = session.user as unknown as Record<string, unknown>;
          u.role = dbUser.role;
          u.isFrozen = dbUser.isFrozen;
          u.displayName = dbUser.displayName;
          u.walletAddress = dbUser.walletAddress;
        }
      }
      return session;
    },
    async signIn({ user }) {
      // Bootstrap admin user on first sign-in
      const adminEmail = process.env.ADMIN_EMAIL_BOOTSTRAP;
      if (adminEmail && user.email === adminEmail) {
        const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (existing && existing.role !== "NETWORK_ADMIN") {
          await prisma.user.update({
            where: { id: existing.id },
            data: { role: "NETWORK_ADMIN" },
          });
        }
      }
      return true;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      if (user.id) {
        await writeAuditLog({
          userId: user.id,
          action: isNewUser ? "USER_REGISTERED" : "USER_SIGNIN",
          entityType: "user",
          entityId: user.id,
        });
      }
    },
    async signOut(message) {
      const s = (message as unknown as { session?: { userId?: string } }).session;
      if (s?.userId) {
        await writeAuditLog({
          userId: s.userId,
          action: "USER_SIGNOUT",
          entityType: "user",
          entityId: s.userId,
        });
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
});
