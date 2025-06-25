/*
  Warnings:

  - Added the required column `actionType` to the `Asignaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asignaciones" ADD COLUMN     "actionType" TEXT NOT NULL;
