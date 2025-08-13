-- AlterTable
ALTER TABLE "Asignaciones" ADD COLUMN     "gerenteId" TEXT;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_gerenteId_fkey" FOREIGN KEY ("gerenteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
