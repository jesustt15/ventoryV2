-- AlterTable
ALTER TABLE "Gerencia" ADD COLUMN     "gerenteId" TEXT;

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "gerenteGeneralId" TEXT,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Configuracion_gerenteGeneralId_key" ON "Configuracion"("gerenteGeneralId");

-- AddForeignKey
ALTER TABLE "Gerencia" ADD CONSTRAINT "Gerencia_gerenteId_fkey" FOREIGN KEY ("gerenteId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Configuracion" ADD CONSTRAINT "Configuracion_gerenteGeneralId_fkey" FOREIGN KEY ("gerenteGeneralId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
