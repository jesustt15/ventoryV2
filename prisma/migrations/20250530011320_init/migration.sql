/*
  Warnings:

  - You are about to drop the column `img` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `img` on the `Dispositivo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Computador" DROP COLUMN "img",
ADD COLUMN     "nsap" TEXT;

-- AlterTable
ALTER TABLE "Dispositivo" DROP COLUMN "img",
ADD COLUMN     "nsap" TEXT;

-- AlterTable
ALTER TABLE "ModeloDispositivo" ADD COLUMN     "img" TEXT;
