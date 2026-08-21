-- CreateEnum
CREATE TYPE "public"."GOAL_SUCCESS_STATUS" AS ENUM ('PENDING', 'SUCCESS', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."GOAL_SUCCESS_REASON" AS ENUM ('MISSING_ITEM', 'FIT', 'QUALITY', 'SETUP', 'DELIVERY', 'BUDGET', 'STYLE', 'WRONG_MATCH', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GOAL_SUCCESS_INTERVENTION_TYPE" AS ENUM ('REVIEW', 'REMINDER', 'SUPPORT_CHAT', 'CARE_GUIDE', 'MISSING_STEP', 'EXCHANGE', 'CURATION');

-- CreateTable
CREATE TABLE "public"."GoalSuccessCheckin" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "goalTemplateId" TEXT,
    "status" "public"."GOAL_SUCCESS_STATUS" NOT NULL DEFAULT 'PENDING',
    "satisfactionScore" INTEGER,
    "primaryReason" "public"."GOAL_SUCCESS_REASON",
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalSuccessCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoalSuccessIntervention" (
    "id" TEXT NOT NULL,
    "checkinId" TEXT NOT NULL,
    "type" "public"."GOAL_SUCCESS_INTERVENTION_TYPE" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalSuccessIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalSuccessCheckin_orderId_key" ON "public"."GoalSuccessCheckin"("orderId");

-- CreateIndex
CREATE INDEX "GoalSuccessCheckin_goalTemplateId_status_idx" ON "public"."GoalSuccessCheckin"("goalTemplateId", "status");

-- CreateIndex
CREATE INDEX "GoalSuccessIntervention_checkinId_sortOrder_idx" ON "public"."GoalSuccessIntervention"("checkinId", "sortOrder");

-- AddForeignKey
ALTER TABLE "public"."GoalSuccessCheckin" ADD CONSTRAINT "GoalSuccessCheckin_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalSuccessCheckin" ADD CONSTRAINT "GoalSuccessCheckin_goalTemplateId_fkey" FOREIGN KEY ("goalTemplateId") REFERENCES "public"."GoalTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalSuccessIntervention" ADD CONSTRAINT "GoalSuccessIntervention_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "public"."GoalSuccessCheckin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

