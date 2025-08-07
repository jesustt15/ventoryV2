-- CreateTable
CREATE TABLE "HistorialModificaciones" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campo" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "computadorId" TEXT NOT NULL,

    CONSTRAINT "HistorialModificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HistorialModificaciones_computadorId_idx" ON "HistorialModificaciones"("computadorId");

-- AddForeignKey
ALTER TABLE "HistorialModificaciones" ADD CONSTRAINT "HistorialModificaciones_computadorId_fkey" FOREIGN KEY ("computadorId") REFERENCES "Computador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
