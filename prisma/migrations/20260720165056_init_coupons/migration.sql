-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_email_key" ON "coupons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
