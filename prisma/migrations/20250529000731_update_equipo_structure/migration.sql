/*
  Warnings:

  - You are about to drop the column `marca` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `modelo` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Computador` table. All the data in the column will be lost.
  - You are about to drop the column `equiposId` on the `LineaTelefonica` table. All the data in the column will be lost.
  - You are about to drop the `Equipos` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[serial]` on the table `Computador` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `modeloId` to the `Computador` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dispositivoId` to the `LineaTelefonica` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Equipos" DROP CONSTRAINT "Equipos_departamentoId_fkey";

-- DropForeignKey
ALTER TABLE "Equipos" DROP CONSTRAINT "Equipos_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "LineaTelefonica" DROP CONSTRAINT "LineaTelefonica_equiposId_fkey";

-- AlterTable
ALTER TABLE "Computador" DROP COLUMN "marca",
DROP COLUMN "modelo",
DROP COLUMN "tipo",
ADD COLUMN     "modeloId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LineaTelefonica" DROP COLUMN "equiposId",
ADD COLUMN     "dispositivoId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Equipos";

-- CreateTable
CREATE TABLE "Marca" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Marca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModeloDispositivo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "marcaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "ModeloDispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispositivo" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "modeloId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "departamentoId" TEXT,
    "img" TEXT,

    CONSTRAINT "Dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Marca_nombre_key" ON "Marca"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Dispositivo_serial_key" ON "Dispositivo"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "Computador_serial_key" ON "Computador"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "ModeloDispositivo" ADD CONSTRAINT "ModeloDispositivo_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "Marca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Computador" ADD CONSTRAINT "Computador_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloDispositivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispositivo" ADD CONSTRAINT "Dispositivo_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "ModeloDispositivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispositivo" ADD CONSTRAINT "Dispositivo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispositivo" ADD CONSTRAINT "Dispositivo_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaTelefonica" ADD CONSTRAINT "LineaTelefonica_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "Dispositivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
