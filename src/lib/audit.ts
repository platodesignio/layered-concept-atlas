import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export async function createAuditLog(params: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  diff?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        diff: params.diff != null
          ? (params.diff as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });
  } catch (e) {
    console.error("Audit log creation failed:", e);
  }
}
