/*
  Warnings:

  - You are about to drop the column `usuarioId` on the `Asignaciones` table. All the data in the column will be lost.
  - Added the required column `targetId` to the `Asignaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetType` to the `Asignaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asignaciones" DROP COLUMN "usuarioId",
ADD COLUMN     "targetId" TEXT NOT NULL,
ADD COLUMN     "targetType" TEXT NOT NULL;
