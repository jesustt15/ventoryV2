-- AlterTable
ALTER TABLE "Computador" ADD COLUMN     "sede" TEXT;

-- AlterTable
ALTER TABLE "Dispositivo" ADD COLUMN     "ip" TEXT;

-- AlterTable
ALTER TABLE "LineaTelefonica" ADD COLUMN     "destino" TEXT,
ADD COLUMN     "estado" TEXT;
