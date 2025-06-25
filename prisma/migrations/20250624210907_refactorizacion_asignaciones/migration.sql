/*
  Warnings:

  - You are about to drop the column `equipoId` on the `Asignaciones` table. All the data in the column will be lost.
  - You are about to drop the column `equipoType` on the `Asignaciones` table. All the data in the column will be lost.
  - You are about to drop the column `targetId` on the `Asignaciones` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Asignaciones` table. All the data in the column will be lost.
  - Added the required column `itemType` to the `Asignaciones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Asignaciones" DROP COLUMN "equipoId",
DROP COLUMN "equipoType",
DROP COLUMN "targetId",
DROP COLUMN "type",
ADD COLUMN     "computadorId" TEXT,
ADD COLUMN     "dispositivoId" TEXT,
ADD COLUMN     "gerente" TEXT,
ADD COLUMN     "itemType" TEXT NOT NULL,
ADD COLUMN     "localidad" TEXT,
ADD COLUMN     "modeloC" TEXT,
ADD COLUMN     "motivo" TEXT,
ADD COLUMN     "serialC" TEXT,
ADD COLUMN     "targetDepartamentoId" TEXT,
ADD COLUMN     "targetUsuarioId" TEXT;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_targetUsuarioId_fkey" FOREIGN KEY ("targetUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_targetDepartamentoId_fkey" FOREIGN KEY ("targetDepartamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_computadorId_fkey" FOREIGN KEY ("computadorId") REFERENCES "Computador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
