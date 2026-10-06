-- CreateTable
CREATE TABLE "product_logs" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "oldValue" DOUBLE PRECISION NOT NULL,
    "newValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_logs_createdAt_idx" ON "product_logs"("createdAt");

-- CreateIndex
CREATE INDEX "product_logs_productId_idx" ON "product_logs"("productId");

-- AddForeignKey
ALTER TABLE "product_logs" ADD CONSTRAINT "product_logs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
