-- CreateEnum
CREATE TYPE "public"."ORDER_TRACKING_EVENT_SOURCE" AS ENUM ('SYSTEM', 'ADMIN');

-- CreateTable
CREATE TABLE "public"."OrderTrackingEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "public"."TRANSACTION_STATUS" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "source" "public"."ORDER_TRACKING_EVENT_SOURCE" NOT NULL DEFAULT 'SYSTEM',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTrackingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderTrackingEvent_orderId_occurredAt_idx" ON "public"."OrderTrackingEvent"("orderId", "occurredAt");

-- AddForeignKey
ALTER TABLE "public"."OrderTrackingEvent" ADD CONSTRAINT "OrderTrackingEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
