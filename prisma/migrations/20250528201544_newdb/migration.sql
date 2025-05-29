-- CreateTable
CREATE TABLE "Gerencia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "sociedad" TEXT NOT NULL,

    CONSTRAINT "Gerencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "gerenciaId" TEXT NOT NULL,
    "ceco" TEXT NOT NULL,

    CONSTRAINT "Departamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "legajo" INTEGER NOT NULL,
    "ced" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Computador" (
    "id" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "usuarioId" TEXT,
    "departamentoId" TEXT,
    "img" TEXT,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "Computador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipos" (
    "id" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "usuarioId" TEXT,
    "departamentoId" TEXT,
    "img" TEXT,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "Equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaTelefonica" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "equiposId" TEXT NOT NULL,

    CONSTRAINT "LineaTelefonica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignaciones" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipoId" TEXT NOT NULL,
    "equipoType" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asignaciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Departamento" ADD CONSTRAINT "Departamento_gerenciaId_fkey" FOREIGN KEY ("gerenciaId") REFERENCES "Gerencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Computador" ADD CONSTRAINT "Computador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Computador" ADD CONSTRAINT "Computador_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipos" ADD CONSTRAINT "Equipos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipos" ADD CONSTRAINT "Equipos_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaTelefonica" ADD CONSTRAINT "LineaTelefonica_equiposId_fkey" FOREIGN KEY ("equiposId") REFERENCES "Equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
