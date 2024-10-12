-- DropForeignKey
ALTER TABLE "Seller" DROP CONSTRAINT "Seller_userId_fkey";

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
