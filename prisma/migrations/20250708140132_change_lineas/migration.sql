/*
  Warnings:

  - You are about to drop the column `dispositivoId` on the `LineaTelefonica` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LineaTelefonica" DROP CONSTRAINT "LineaTelefonica_dispositivoId_fkey";

-- AlterTable
ALTER TABLE "Asignaciones" ADD COLUMN     "lineaTelefonicaId" TEXT;

-- AlterTable
ALTER TABLE "LineaTelefonica" DROP COLUMN "dispositivoId",
ADD COLUMN     "imei" TEXT;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_lineaTelefonicaId_fkey" FOREIGN KEY ("lineaTelefonicaId") REFERENCES "LineaTelefonica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
