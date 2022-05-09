/*
  Warnings:

  - Added the required column `updatedAt` to the `Role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RolesOfProfile` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Duty" AS ENUM ('OWNER', 'MANAGER', 'WORKER');

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "RolesOfProfile" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Business" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessWorker" (
    "id" SERIAL NOT NULL,
    "duty" "Duty" NOT NULL,
    "profileId" INTEGER,
    "businessId" INTEGER,

    CONSTRAINT "BusinessWorker_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BusinessWorker" ADD CONSTRAINT "BusinessWorker_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessWorker" ADD CONSTRAINT "BusinessWorker_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
