-- CreateEnum
CREATE TYPE "public"."COMPANION_TASK_KIND" AS ENUM ('SETUP', 'CARE', 'WARRANTY', 'REORDER', 'SUPPORT');

-- CreateTable
CREATE TABLE "public"."OrderCompanion" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "supportLabel" TEXT NOT NULL,
    "supportDescription" TEXT NOT NULL,
    "reorderRecommendation" TEXT NOT NULL,
    "reorderSuggestedDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCompanion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompanionTask" (
    "id" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "kind" "public"."COMPANION_TASK_KIND" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanionTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductCareGuide" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCareGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WarrantyInfo" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "provider" TEXT,
    "durationDays" INTEGER,
    "claimSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarrantyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoalTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "suggestedBudget" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoalTemplateStep" (
    "id" TEXT NOT NULL,
    "goalTemplateId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fallbackKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "budgetWeight" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalTemplateStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoalBundle" (
    "id" TEXT NOT NULL,
    "goalTemplateId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "budget" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "remainingBudget" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalBundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoalBundleItem" (
    "id" TEXT NOT NULL,
    "goalBundleId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "stepLabel" TEXT NOT NULL,
    "stepDescription" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "allocatedBudget" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalBundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderCompanion_orderId_key" ON "public"."OrderCompanion"("orderId");

-- CreateIndex
CREATE INDEX "OrderCompanion_orderId_idx" ON "public"."OrderCompanion"("orderId");

-- CreateIndex
CREATE INDEX "CompanionTask_companionId_kind_sortOrder_idx" ON "public"."CompanionTask"("companionId", "kind", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductCareGuide_productId_sortOrder_idx" ON "public"."ProductCareGuide"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "WarrantyInfo_productId_idx" ON "public"."WarrantyInfo"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalTemplate_slug_key" ON "public"."GoalTemplate"("slug");

-- CreateIndex
CREATE INDEX "GoalTemplate_slug_idx" ON "public"."GoalTemplate"("slug");

-- CreateIndex
CREATE INDEX "GoalTemplateStep_goalTemplateId_sortOrder_idx" ON "public"."GoalTemplateStep"("goalTemplateId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "GoalTemplateStep_goalTemplateId_stepKey_key" ON "public"."GoalTemplateStep"("goalTemplateId", "stepKey");

-- CreateIndex
CREATE INDEX "GoalBundle_goalTemplateId_createdAt_idx" ON "public"."GoalBundle"("goalTemplateId", "createdAt");

-- CreateIndex
CREATE INDEX "GoalBundle_userId_sessionId_createdAt_idx" ON "public"."GoalBundle"("userId", "sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "GoalBundleItem_goalBundleId_stepKey_idx" ON "public"."GoalBundleItem"("goalBundleId", "stepKey");

-- AddForeignKey
ALTER TABLE "public"."OrderCompanion" ADD CONSTRAINT "OrderCompanion_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompanionTask" ADD CONSTRAINT "CompanionTask_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "public"."OrderCompanion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductCareGuide" ADD CONSTRAINT "ProductCareGuide_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WarrantyInfo" ADD CONSTRAINT "WarrantyInfo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalTemplateStep" ADD CONSTRAINT "GoalTemplateStep_goalTemplateId_fkey" FOREIGN KEY ("goalTemplateId") REFERENCES "public"."GoalTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalBundle" ADD CONSTRAINT "GoalBundle_goalTemplateId_fkey" FOREIGN KEY ("goalTemplateId") REFERENCES "public"."GoalTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalBundle" ADD CONSTRAINT "GoalBundle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalBundleItem" ADD CONSTRAINT "GoalBundleItem_goalBundleId_fkey" FOREIGN KEY ("goalBundleId") REFERENCES "public"."GoalBundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalBundleItem" ADD CONSTRAINT "GoalBundleItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
