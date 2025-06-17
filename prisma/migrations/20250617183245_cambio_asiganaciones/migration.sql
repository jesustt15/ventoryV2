-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'user';

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_targetId_usuario_fkey" FOREIGN KEY ("targetId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignaciones" ADD CONSTRAINT "Asignaciones_targetId_departamento_fkey" FOREIGN KEY ("targetId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
