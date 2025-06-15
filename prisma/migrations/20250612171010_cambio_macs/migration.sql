-- AlterTable
ALTER TABLE "Computador" ADD COLUMN     "macEthernet" TEXT,
ADD COLUMN     "macWifi" TEXT;

-- AlterTable
ALTER TABLE "Dispositivo" ADD COLUMN     "mac" TEXT;
