-- CreateEnum
CREATE TYPE "CHECKOUT_ATTEMPT_STATUS" AS ENUM ('STARTED', 'FAILED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "CHECKOUT_RECOVERY_STATUS" AS ENUM ('OPEN', 'RESOLVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SHARED_CART_MEMBER_ROLE" AS ENUM ('OWNER', 'CONTRIBUTOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "SHARED_CART_VOTE_TYPE" AS ENUM ('UPVOTE', 'DOWNVOTE');

-- CreateTable
CREATE TABLE "CheckoutAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "status" "CHECKOUT_ATTEMPT_STATUS" NOT NULL DEFAULT 'STARTED',
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "amount" DOUBLE PRECISION NOT NULL,
    "checkoutReference" TEXT,
    "failureReason" TEXT,
    "cartSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckoutRecovery" (
    "id" TEXT NOT NULL,
    "checkoutAttemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "CHECKOUT_RECOVERY_STATUS" NOT NULL DEFAULT 'OPEN',
    "lastError" TEXT,
    "chatId" TEXT,
    "cartSnapshot" JSONB NOT NULL,
    "resumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutRecovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderReminder" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCart" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCartMember" (
    "id" TEXT NOT NULL,
    "sharedCartId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "token" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "SHARED_CART_MEMBER_ROLE" NOT NULL DEFAULT 'CONTRIBUTOR',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedCartMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCartVote" (
    "id" TEXT NOT NULL,
    "sharedCartId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "memberToken" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "vote" "SHARED_CART_VOTE_TYPE" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedCartVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedCartNote" (
    "id" TEXT NOT NULL,
    "sharedCartId" TEXT NOT NULL,
    "variantId" TEXT,
    "memberToken" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedCartNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutAttempt_userId_cartId_status_idx" ON "CheckoutAttempt"("userId", "cartId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRecovery_checkoutAttemptId_key" ON "CheckoutRecovery"("checkoutAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckoutRecovery_code_key" ON "CheckoutRecovery"("code");

-- CreateIndex
CREATE INDEX "CheckoutRecovery_userId_status_updatedAt_idx" ON "CheckoutRecovery"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "OrderReminder_orderId_userId_idx" ON "OrderReminder"("orderId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCart_code_key" ON "SharedCart"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCart_cartId_key" ON "SharedCart"("cartId");

-- CreateIndex
CREATE INDEX "SharedCart_ownerId_idx" ON "SharedCart"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCartMember_sharedCartId_token_key" ON "SharedCartMember"("sharedCartId", "token");

-- CreateIndex
CREATE INDEX "SharedCartMember_sharedCartId_userId_sessionId_idx" ON "SharedCartMember"("sharedCartId", "userId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SharedCartVote_sharedCartId_variantId_memberToken_key" ON "SharedCartVote"("sharedCartId", "variantId", "memberToken");

-- CreateIndex
CREATE INDEX "SharedCartVote_sharedCartId_variantId_idx" ON "SharedCartVote"("sharedCartId", "variantId");

-- CreateIndex
CREATE INDEX "SharedCartNote_sharedCartId_variantId_idx" ON "SharedCartNote"("sharedCartId", "variantId");

-- AddForeignKey
ALTER TABLE "CheckoutAttempt" ADD CONSTRAINT "CheckoutAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutAttempt" ADD CONSTRAINT "CheckoutAttempt_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutRecovery" ADD CONSTRAINT "CheckoutRecovery_checkoutAttemptId_fkey" FOREIGN KEY ("checkoutAttemptId") REFERENCES "CheckoutAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutRecovery" ADD CONSTRAINT "CheckoutRecovery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckoutRecovery" ADD CONSTRAINT "CheckoutRecovery_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReminder" ADD CONSTRAINT "OrderReminder_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderReminder" ADD CONSTRAINT "OrderReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCart" ADD CONSTRAINT "SharedCart_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCart" ADD CONSTRAINT "SharedCart_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCartMember" ADD CONSTRAINT "SharedCartMember_sharedCartId_fkey" FOREIGN KEY ("sharedCartId") REFERENCES "SharedCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCartMember" ADD CONSTRAINT "SharedCartMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCartVote" ADD CONSTRAINT "SharedCartVote_sharedCartId_fkey" FOREIGN KEY ("sharedCartId") REFERENCES "SharedCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCartVote" ADD CONSTRAINT "SharedCartVote_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCartNote" ADD CONSTRAINT "SharedCartNote_sharedCartId_fkey" FOREIGN KEY ("sharedCartId") REFERENCES "SharedCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedCartNote" ADD CONSTRAINT "SharedCartNote_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
