// Script temporal para crear las gerencias necesarias
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creando gerencias...');

  const gerencias = [
    'Gcia. De Personas, Cultura y Comunicacion',
    'Gerencia de Administracion y Finanzas',
    'Gerencia de Ventas Nacionales y Mercadeo',
    'Gerencia Forestal e Institucional',
    'Gerencia General',
    'Gerencia Legal',
    'Gerencia Operaciones Industriales y Sum.',
    'Gerencia SMS y PCP'
  ];

  for (const nombre of gerencias) {
    await prisma.gerencia.upsert({
      where: { id: '' }, // Dummy where para que siempre cree
      update: {},
      create: {
        nombre: nombre,
      },
    }).catch(() => {
      // Si falla, intentar crear directamente
      return prisma.gerencia.create({
        data: { nombre },
      }).catch(() => console.log(`Gerencia "${nombre}" ya existe`));
    });
  }

  const count = await prisma.gerencia.count();
  console.log(`✅ Gerencias creadas. Total en BD: ${count}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
