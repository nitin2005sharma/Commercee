-- CreateEnum
CREATE TYPE "public"."GOAL_SUCCESS_STAGE" AS ENUM ('DELIVERY', 'SETUP', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "public"."GOAL_STEP_SUCCESS_STATUS" AS ENUM ('PENDING', 'ACHIEVED', 'PARTIAL', 'MISSED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "public"."SHARED_CART_INVITE_MODE" AS ENUM ('COLLABORATE', 'VIEW_ONLY');

-- CreateEnum
CREATE TYPE "public"."SHARED_CART_ASSIGNMENT_STATUS" AS ENUM ('CLAIMED', 'PURCHASING', 'PURCHASED', 'RELEASED');

-- CreateEnum
CREATE TYPE "public"."SHARED_CART_ACTIVITY_TYPE" AS ENUM ('MEMBER_JOINED', 'ITEM_UPDATED', 'ITEM_REMOVED', 'VOTE_ADDED', 'NOTE_ADDED', 'ASSIGNMENT_UPDATED', 'SETTINGS_UPDATED', 'INVITE_REGENERATED');

-- AlterTable
ALTER TABLE "public"."Cart"
ADD COLUMN "goalBundleId" TEXT,
ADD COLUMN "goalTemplateId" TEXT;

-- AlterTable
ALTER TABLE "public"."GoalBundle"
ADD COLUMN "brief" JSONB,
ADD COLUMN "name" TEXT,
ADD COLUMN "shareCode" TEXT;

-- AlterTable
ALTER TABLE "public"."GoalBundleItem"
ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "selectionReason" TEXT;

-- AlterTable
ALTER TABLE "public"."Order"
ADD COLUMN "goalBundleId" TEXT,
ADD COLUMN "goalTemplateId" TEXT;

-- AlterTable
ALTER TABLE "public"."SharedCart"
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "goalBundleId" TEXT,
ADD COLUMN "inviteMode" "public"."SHARED_CART_INVITE_MODE" NOT NULL DEFAULT 'COLLABORATE',
ADD COLUMN "isReadOnly" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."GoalSuccessStageCheckin" (
  "id" TEXT NOT NULL,
  "checkinId" TEXT NOT NULL,
  "stage" "public"."GOAL_SUCCESS_STAGE" NOT NULL,
  "status" "public"."GOAL_SUCCESS_STATUS" NOT NULL DEFAULT 'PENDING',
  "satisfactionScore" INTEGER,
  "primaryReason" "public"."GOAL_SUCCESS_REASON",
  "notes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GoalSuccessStageCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GoalSuccessStepCheckin" (
  "id" TEXT NOT NULL,
  "stageCheckinId" TEXT NOT NULL,
  "stepKey" TEXT NOT NULL,
  "stepLabel" TEXT NOT NULL,
  "status" "public"."GOAL_STEP_SUCCESS_STATUS" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GoalSuccessStepCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SharedCartAssignment" (
  "id" TEXT NOT NULL,
  "sharedCartId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "memberToken" TEXT NOT NULL,
  "assigneeName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "status" "public"."SHARED_CART_ASSIGNMENT_STATUS" NOT NULL DEFAULT 'CLAIMED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SharedCartAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SharedCartActivity" (
  "id" TEXT NOT NULL,
  "sharedCartId" TEXT NOT NULL,
  "memberToken" TEXT,
  "actorName" TEXT,
  "type" "public"."SHARED_CART_ACTIVITY_TYPE" NOT NULL,
  "message" TEXT NOT NULL,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SharedCartActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalSuccessStageCheckin_stage_status_idx" ON "public"."GoalSuccessStageCheckin"("stage", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GoalSuccessStageCheckin_checkinId_stage_key" ON "public"."GoalSuccessStageCheckin"("checkinId", "stage");

-- CreateIndex
CREATE INDEX "GoalSuccessStepCheckin_stageCheckinId_status_idx" ON "public"."GoalSuccessStepCheckin"("stageCheckinId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "GoalSuccessStepCheckin_stageCheckinId_stepKey_key" ON "public"."GoalSuccessStepCheckin"("stageCheckinId", "stepKey");

-- CreateIndex
CREATE INDEX "SharedCartAssignment_sharedCartId_variantId_idx" ON "public"."SharedCartAssignment"("sharedCartId", "variantId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCartAssignment_sharedCartId_variantId_memberToken_key" ON "public"."SharedCartAssignment"("sharedCartId", "variantId", "memberToken");

-- CreateIndex
CREATE INDEX "SharedCartActivity_sharedCartId_createdAt_idx" ON "public"."SharedCartActivity"("sharedCartId", "createdAt");

-- CreateIndex
CREATE INDEX "Cart_goalTemplateId_goalBundleId_idx" ON "public"."Cart"("goalTemplateId", "goalBundleId");

-- CreateIndex
CREATE UNIQUE INDEX "GoalBundle_shareCode_key" ON "public"."GoalBundle"("shareCode");

-- CreateIndex
CREATE INDEX "GoalBundle_shareCode_idx" ON "public"."GoalBundle"("shareCode");

-- CreateIndex
CREATE INDEX "Order_goalTemplateId_goalBundleId_idx" ON "public"."Order"("goalTemplateId", "goalBundleId");

-- CreateIndex
CREATE INDEX "SharedCart_goalBundleId_idx" ON "public"."SharedCart"("goalBundleId");

-- AddForeignKey
ALTER TABLE "public"."Order"
ADD CONSTRAINT "Order_goalTemplateId_fkey"
FOREIGN KEY ("goalTemplateId") REFERENCES "public"."GoalTemplate"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order"
ADD CONSTRAINT "Order_goalBundleId_fkey"
FOREIGN KEY ("goalBundleId") REFERENCES "public"."GoalBundle"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart"
ADD CONSTRAINT "Cart_goalTemplateId_fkey"
FOREIGN KEY ("goalTemplateId") REFERENCES "public"."GoalTemplate"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart"
ADD CONSTRAINT "Cart_goalBundleId_fkey"
FOREIGN KEY ("goalBundleId") REFERENCES "public"."GoalBundle"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalSuccessStageCheckin"
ADD CONSTRAINT "GoalSuccessStageCheckin_checkinId_fkey"
FOREIGN KEY ("checkinId") REFERENCES "public"."GoalSuccessCheckin"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GoalSuccessStepCheckin"
ADD CONSTRAINT "GoalSuccessStepCheckin_stageCheckinId_fkey"
FOREIGN KEY ("stageCheckinId") REFERENCES "public"."GoalSuccessStageCheckin"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SharedCart"
ADD CONSTRAINT "SharedCart_goalBundleId_fkey"
FOREIGN KEY ("goalBundleId") REFERENCES "public"."GoalBundle"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SharedCartAssignment"
ADD CONSTRAINT "SharedCartAssignment_sharedCartId_fkey"
FOREIGN KEY ("sharedCartId") REFERENCES "public"."SharedCart"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SharedCartAssignment"
ADD CONSTRAINT "SharedCartAssignment_variantId_fkey"
FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SharedCartActivity"
ADD CONSTRAINT "SharedCartActivity_sharedCartId_fkey"
FOREIGN KEY ("sharedCartId") REFERENCES "public"."SharedCart"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
