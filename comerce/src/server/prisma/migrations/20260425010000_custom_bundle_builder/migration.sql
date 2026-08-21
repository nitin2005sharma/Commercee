CREATE TYPE "GOAL_BUNDLE_TYPE" AS ENUM ('CURATED', 'CUSTOM', 'FREQUENT');

ALTER TABLE "GoalBundle"
ADD COLUMN "bundleType" "GOAL_BUNDLE_TYPE" NOT NULL DEFAULT 'CURATED';

ALTER TABLE "GoalBundle"
ALTER COLUMN "goalTemplateId" DROP NOT NULL;

ALTER TABLE "GoalBundleItem"
ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "GoalBundle"
DROP CONSTRAINT "GoalBundle_goalTemplateId_fkey";

ALTER TABLE "GoalBundle"
ADD CONSTRAINT "GoalBundle_goalTemplateId_fkey"
FOREIGN KEY ("goalTemplateId") REFERENCES "GoalTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX IF EXISTS "GoalBundle_goalTemplateId_createdAt_idx";

CREATE INDEX "GoalBundle_goalTemplateId_bundleType_createdAt_idx"
ON "GoalBundle"("goalTemplateId", "bundleType", "createdAt");
