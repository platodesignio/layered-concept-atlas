import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

interface AuditParams {
  userId?: string;
  orderId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      orderId: params.orderId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: params.metadata as never,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

interface ExecutionParams {
  orderId: string;
  actor: "system" | "admin" | "user";
  action: string;
  inputHash?: string;
  metadata?: Record<string, unknown>;
}

export async function startExecution(params: ExecutionParams): Promise<string> {
  const executionId = uuidv4();
  await prisma.executionLog.create({
    data: {
      executionId,
      orderId: params.orderId,
      actor: params.actor,
      action: params.action,
      inputHash: params.inputHash,
      metadata: params.metadata as never,
      startedAt: new Date(),
    },
  });
  return executionId;
}

export async function finishExecution(
  executionId: string,
  outputHash?: string,
  error?: string
): Promise<void> {
  await prisma.executionLog.update({
    where: { executionId },
    data: {
      outputHash,
      error,
      finishedAt: new Date(),
    },
  });
}

// Backward compatibility alias
export const writeAuditLog = createAuditLog;
