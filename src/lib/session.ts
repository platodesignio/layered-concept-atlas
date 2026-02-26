import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  role: Role;
  isFrozen: boolean;
  walletAddress: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      displayName: true,
      role: true,
      isFrozen: true,
      walletAddress: true,
    },
  });
  return user;
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.isFrozen) {
    throw new Error("FROZEN");
  }
  return user;
}

export async function isNetworkMember(userId: string): Promise<boolean> {
  const membership = await prisma.networkMembership.findUnique({
    where: { userId },
    select: { status: true, validUntil: true },
  });
  if (!membership) return false;
  return membership.status === "active" && (membership.validUntil == null || membership.validUntil > new Date());
}

export async function isProjectMember(userId: string, projectId: string): Promise<boolean> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!member;
}

export async function getProjectRole(userId: string, projectId: string): Promise<Role | null> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  if (member) return member.role;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (project?.ownerId === userId) return "PROJECT_OWNER";
  return null;
}
