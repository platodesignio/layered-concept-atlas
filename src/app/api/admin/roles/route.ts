import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { Role } from "@prisma/client";

const RoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(Role),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = RoleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { userId, role } = parsed.data;

  // Cannot demote self from NETWORK_ADMIN
  if (userId === user.id && role !== "NETWORK_ADMIN") {
    return NextResponse.json({ error: "Cannot demote self" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "ROLE_CHANGED",
        entityType: "user",
        entityId: userId,
        metadata: { role },
      },
    });
    return u;
  });

  return NextResponse.json({ user: updated });
}
