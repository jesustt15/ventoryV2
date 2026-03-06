/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Gerencia` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numero]` on the table `LineaTelefonica` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LineaTelefonica" ADD COLUMN     "usuarioId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Gerencia_nombre_key" ON "Gerencia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "LineaTelefonica_numero_key" ON "LineaTelefonica"("numero");

-- AddForeignKey
ALTER TABLE "LineaTelefonica" ADD CONSTRAINT "LineaTelefonica_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
