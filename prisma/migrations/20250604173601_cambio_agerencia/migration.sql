/*
  Warnings:

  - You are about to drop the column `sociedad` on the `Gerencia` table. All the data in the column will be lost.
  - Added the required column `sociedad` to the `Departamento` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Departamento" ADD COLUMN     "sociedad" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Gerencia" DROP COLUMN "sociedad";
