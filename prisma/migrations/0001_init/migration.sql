-- CreateTable users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable sessions
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateTable layer_definitions
CREATE TABLE "layer_definitions" (
    "id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "nameJa" TEXT NOT NULL,
    "descriptionJa" TEXT NOT NULL,
    "colorClass" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "layer_definitions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "layer_definitions_index_key" ON "layer_definitions"("index");
CREATE UNIQUE INDEX "layer_definitions_slug_key" ON "layer_definitions"("slug");

-- CreateTable dictionary_terms
CREATE TABLE "dictionary_terms" (
    "id" TEXT NOT NULL,
    "layerId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "isNegation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dictionary_terms_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "dictionary_terms_layerId_idx" ON "dictionary_terms"("layerId");

-- CreateTable mapping_rules
CREATE TABLE "mapping_rules" (
    "id" TEXT NOT NULL,
    "fromLayerId" TEXT NOT NULL,
    "toLayerId" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "replacement" TEXT NOT NULL,
    "condition" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mapping_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "mapping_rules_fromLayerId_idx" ON "mapping_rules"("fromLayerId");
CREATE INDEX "mapping_rules_toLayerId_idx" ON "mapping_rules"("toLayerId");

-- CreateTable concepts
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleJa" TEXT NOT NULL,
    "summary" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "concepts_slug_key" ON "concepts"("slug");

-- CreateTable layer_entries
CREATE TABLE "layer_entries" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "layerId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "layer_entries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "layer_entries_conceptId_layerId_key" ON "layer_entries"("conceptId", "layerId");
CREATE INDEX "layer_entries_conceptId_idx" ON "layer_entries"("conceptId");
CREATE INDEX "layer_entries_layerId_idx" ON "layer_entries"("layerId");

-- CreateTable concept_links
CREATE TABLE "concept_links" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "concept_links_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "concept_links_fromId_toId_relation_key" ON "concept_links"("fromId", "toId", "relation");

-- CreateTable assertion_tests
CREATE TABLE "assertion_tests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inputText" TEXT NOT NULL,
    "expectedLayer" TEXT NOT NULL,
    "expectedMinScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assertion_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable runs
CREATE TABLE "runs" (
    "id" TEXT NOT NULL,
    "runType" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "runs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "runs_inputHash_idx" ON "runs"("inputHash");

-- CreateTable run_artifacts
CREATE TABLE "run_artifacts" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "run_artifacts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "run_artifacts_runId_key_key" ON "run_artifacts"("runId", "key");

-- CreateTable feedbacks
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "runId" TEXT,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "feedbacks_runId_idx" ON "feedbacks"("runId");

-- CreateTable audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "diff" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateTable pack_versions
CREATE TABLE "pack_versions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pack_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pack_versions_key_key" ON "pack_versions"("key");

-- CreateTable rate_limits
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rate_limits_ip_endpoint_key" ON "rate_limits"("ip", "endpoint");
CREATE INDEX "rate_limits_windowEnd_idx" ON "rate_limits"("windowEnd");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dictionary_terms" ADD CONSTRAINT "dictionary_terms_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "layer_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mapping_rules" ADD CONSTRAINT "mapping_rules_fromLayerId_fkey" FOREIGN KEY ("fromLayerId") REFERENCES "layer_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "mapping_rules" ADD CONSTRAINT "mapping_rules_toLayerId_fkey" FOREIGN KEY ("toLayerId") REFERENCES "layer_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "layer_entries" ADD CONSTRAINT "layer_entries_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "layer_entries" ADD CONSTRAINT "layer_entries_layerId_fkey" FOREIGN KEY ("layerId") REFERENCES "layer_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "concept_links" ADD CONSTRAINT "concept_links_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "concept_links" ADD CONSTRAINT "concept_links_toId_fkey" FOREIGN KEY ("toId") REFERENCES "concepts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "run_artifacts" ADD CONSTRAINT "run_artifacts_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_runId_fkey" FOREIGN KEY ("runId") REFERENCES "runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
