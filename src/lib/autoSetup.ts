/**
 * autoSetup.ts
 * サーバー起動時に自動でDBマイグレーション＋シードを実行する
 * Next.js Instrumentation API から呼ばれる (src/instrumentation.ts)
 */

import { prisma } from "./prisma";

let ran = false;

export async function autoMigrateAndSeed() {
  if (ran) return;
  ran = true;

  console.log("[autoSetup] Starting automatic DB setup...");

  try {
    await runMigration();
    console.log("[autoSetup] Migration OK");
  } catch (e) {
    console.error("[autoSetup] Migration failed:", e);
    return;
  }

  try {
    await runSeed();
    console.log("[autoSetup] Seed OK");
  } catch (e) {
    console.error("[autoSetup] Seed failed:", e);
  }
}

async function runMigration() {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "users_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")`,
    `CREATE TABLE IF NOT EXISTS "sessions" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token")`,
    `CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId")`,
    `CREATE TABLE IF NOT EXISTS "layer_definitions" (
      "id" TEXT NOT NULL,
      "index" INTEGER NOT NULL,
      "slug" TEXT NOT NULL,
      "nameJa" TEXT NOT NULL,
      "descriptionJa" TEXT NOT NULL,
      "colorClass" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "layer_definitions_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "layer_definitions_index_key" ON "layer_definitions"("index")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "layer_definitions_slug_key" ON "layer_definitions"("slug")`,
    `CREATE TABLE IF NOT EXISTS "dictionary_terms" (
      "id" TEXT NOT NULL,
      "layerId" TEXT NOT NULL,
      "term" TEXT NOT NULL,
      "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
      "isNegation" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "dictionary_terms_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "dictionary_terms_layerId_idx" ON "dictionary_terms"("layerId")`,
    `CREATE TABLE IF NOT EXISTS "mapping_rules" (
      "id" TEXT NOT NULL,
      "fromLayerId" TEXT NOT NULL,
      "toLayerId" TEXT NOT NULL,
      "pattern" TEXT NOT NULL,
      "replacement" TEXT NOT NULL,
      "condition" TEXT,
      "priority" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "mapping_rules_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE TABLE IF NOT EXISTS "concepts" (
      "id" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "titleJa" TEXT NOT NULL,
      "summary" TEXT,
      "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "isPublished" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "concepts_slug_key" ON "concepts"("slug")`,
    `CREATE TABLE IF NOT EXISTS "layer_entries" (
      "id" TEXT NOT NULL,
      "conceptId" TEXT NOT NULL,
      "layerId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "layer_entries_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "layer_entries_conceptId_layerId_key" ON "layer_entries"("conceptId", "layerId")`,
    `CREATE INDEX IF NOT EXISTS "layer_entries_conceptId_idx" ON "layer_entries"("conceptId")`,
    `CREATE INDEX IF NOT EXISTS "layer_entries_layerId_idx" ON "layer_entries"("layerId")`,
    `CREATE TABLE IF NOT EXISTS "concept_links" (
      "id" TEXT NOT NULL,
      "fromId" TEXT NOT NULL,
      "toId" TEXT NOT NULL,
      "relation" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "concept_links_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "concept_links_fromId_toId_relation_key" ON "concept_links"("fromId", "toId", "relation")`,
    `CREATE TABLE IF NOT EXISTS "runs" (
      "id" TEXT NOT NULL,
      "runType" TEXT NOT NULL,
      "inputHash" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "runs_inputHash_idx" ON "runs"("inputHash")`,
    `CREATE TABLE IF NOT EXISTS "run_artifacts" (
      "id" TEXT NOT NULL,
      "runId" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "value" JSONB NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "run_artifacts_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "run_artifacts_runId_key_key" ON "run_artifacts"("runId", "key")`,
    `CREATE TABLE IF NOT EXISTS "feedbacks" (
      "id" TEXT NOT NULL,
      "runId" TEXT,
      "userId" TEXT,
      "rating" INTEGER NOT NULL,
      "comment" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "feedbacks_runId_idx" ON "feedbacks"("runId")`,
    `CREATE TABLE IF NOT EXISTS "audit_logs" (
      "id" TEXT NOT NULL,
      "userId" TEXT,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT NOT NULL,
      "diff" JSONB,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId")`,
    `CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId")`,
    `CREATE TABLE IF NOT EXISTS "pack_versions" (
      "id" TEXT NOT NULL,
      "key" TEXT NOT NULL,
      "version" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "pack_versions_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "pack_versions_key_key" ON "pack_versions"("key")`,
    `CREATE TABLE IF NOT EXISTS "rate_limits" (
      "id" TEXT NOT NULL,
      "ip" TEXT NOT NULL,
      "endpoint" TEXT NOT NULL,
      "count" INTEGER NOT NULL DEFAULT 1,
      "windowEnd" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "rate_limits_ip_endpoint_key" ON "rate_limits"("ip", "endpoint")`,
    `CREATE INDEX IF NOT EXISTS "rate_limits_windowEnd_idx" ON "rate_limits"("windowEnd")`,
    `CREATE TABLE IF NOT EXISTS "assertion_tests" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "inputText" TEXT NOT NULL,
      "expectedLayer" TEXT NOT NULL,
      "expectedMinScore" DOUBLE PRECISION NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "assertion_tests_pkey" PRIMARY KEY ("id")
    )`,
    // --- Stripe Billing tables ---
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Plan') THEN CREATE TYPE "Plan" AS ENUM ('FREE', 'CREATOR', 'AXIS'); END IF; END $$`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TermScope') THEN CREATE TYPE "TermScope" AS ENUM ('SYSTEM', 'USER'); END IF; END $$`,
    `CREATE TABLE IF NOT EXISTS "stripe_customers" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "stripeCustomerId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "stripe_customers_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "stripe_customers_userId_key" ON "stripe_customers"("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "stripe_customers_stripeCustomerId_key" ON "stripe_customers"("stripeCustomerId")`,
    `CREATE TABLE IF NOT EXISTS "subscriptions" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "stripeSubscriptionId" TEXT NOT NULL,
      "stripePriceId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "plan" TEXT NOT NULL DEFAULT 'FREE',
      "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
      "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_userId_key" ON "subscriptions"("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_stripeSubscriptionId_key" ON "subscriptions"("stripeSubscriptionId")`,
    `CREATE TABLE IF NOT EXISTS "entitlements" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "capabilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "source" TEXT NOT NULL DEFAULT 'system',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "entitlements_userId_key" ON "entitlements"("userId")`,
    `CREATE TABLE IF NOT EXISTS "billing_events" (
      "id" TEXT NOT NULL,
      "stripeEventId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "payloadJson" JSONB NOT NULL,
      "processedAt" TIMESTAMP(3),
      "processResult" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "billing_events_stripeEventId_key" ON "billing_events"("stripeEventId")`,
    `CREATE TABLE IF NOT EXISTS "concept_packs" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "isPublic" BOOLEAN NOT NULL DEFAULT false,
      "version" INTEGER NOT NULL DEFAULT 1,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "concept_packs_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE INDEX IF NOT EXISTS "concept_packs_userId_idx" ON "concept_packs"("userId")`,
    `CREATE TABLE IF NOT EXISTS "concept_pack_items" (
      "id" TEXT NOT NULL,
      "packId" TEXT NOT NULL,
      "conceptId" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "concept_pack_items_pkey" PRIMARY KEY ("id")
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "concept_pack_items_packId_conceptId_key" ON "concept_pack_items"("packId", "conceptId")`,
    // Add new columns to existing tables (ignore if already exists)
    `ALTER TABLE "runs" ADD COLUMN IF NOT EXISTS "userId" TEXT`,
    `ALTER TABLE "dictionary_terms" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'SYSTEM'`,
    `ALTER TABLE "dictionary_terms" ADD COLUMN IF NOT EXISTS "userId" TEXT`,
    `ALTER TABLE "mapping_rules" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'SYSTEM'`,
    `ALTER TABLE "mapping_rules" ADD COLUMN IF NOT EXISTS "userId" TEXT`,
    `ALTER TABLE "concepts" ADD COLUMN IF NOT EXISTS "ownerId" TEXT`,
    `ALTER TABLE "feedbacks" ADD COLUMN IF NOT EXISTS "pagePath" TEXT`,
  ];

  for (const stmt of stmts) {
    await prisma.$executeRawUnsafe(stmt);
  }

  // Foreign keys (ignore if already exists)
  const fks = [
    `DO $$ BEGIN ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "dictionary_terms" ADD CONSTRAINT "dictionary_terms_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "layer_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "layer_entries" ADD CONSTRAINT "layer_entries_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "layer_entries" ADD CONSTRAINT "layer_entries_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "layer_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "run_artifacts" ADD CONSTRAINT "run_artifacts_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "stripe_customers" ADD CONSTRAINT "stripe_customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "concept_packs" ADD CONSTRAINT "concept_packs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "concept_pack_items" ADD CONSTRAINT "concept_pack_items_packId_fkey" FOREIGN KEY ("packId") REFERENCES "concept_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN ALTER TABLE "concept_pack_items" ADD CONSTRAINT "concept_pack_items_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$`,
  ];
  for (const fk of fks) {
    await prisma.$executeRawUnsafe(fk).catch(() => {});
  }
}

async function runSeed() {
  // Check if already seeded
  const existingLayers = await prisma.layerDefinition.count();
  if (existingLayers > 0) {
    console.log("[autoSetup] Already seeded, skipping");
    return;
  }

  const { seedData } = await import("./seedData");
  await seedData(prisma);
}
