ALTER TABLE "Chat"
ADD COLUMN "orderId" TEXT;

ALTER TABLE "Chat"
ADD CONSTRAINT "Chat_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "Chat_orderId_idx" ON "Chat"("orderId");

CREATE INDEX "Chat_userId_orderId_status_idx" ON "Chat"("userId", "orderId", "status");
