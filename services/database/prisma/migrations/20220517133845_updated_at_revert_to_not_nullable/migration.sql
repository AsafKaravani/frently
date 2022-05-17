/*
  Warnings:

  - Made the column `updatedAt` on table `Business` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `BusinessWorker` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Category` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `CategoryFieldValue` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `City` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `ProductCategory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `Role` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `RolesOfProfile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Business" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "BusinessWorker" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "CategoryFieldValue" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "City" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProductCategory" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "RolesOfProfile" ALTER COLUMN "updatedAt" SET NOT NULL;
