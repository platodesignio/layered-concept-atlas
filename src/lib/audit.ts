import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface AuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

function serializeMeta(m: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | undefined {
  if (m == null) return undefined;
  return JSON.parse(JSON.stringify(m)) as Prisma.InputJsonValue;
}

/**
 * 監査ログを追記する。削除不可・改変不可の追記専用関数。
 * DB制約でDELETE/UPDATEを禁止することは不可能なため、
 * アプリケーション層でのみ追記を許可し、管理者UIでも削除ボタンを非表示にする。
 */
export async function writeAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: serializeMeta(params.metadata),
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}

export async function writeAuditLogTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  params: AuditParams
): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: serializeMeta(params.metadata),
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
    },
  });
}
