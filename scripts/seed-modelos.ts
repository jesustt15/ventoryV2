// scripts/seed-marcas-modelos.ts

import { PrismaClient } from '@prisma/client';

// Inicializa el cliente de Prisma
const prisma = new PrismaClient();

// Define tus datos aquí. Cada objeto 'marca' tiene una lista de 'modelos'.
const datosDeInventario = [
  {
    nombre: 'Hewlett-Packard',
    modelos: [
      {
        nombre: 'Elitebook 1040 G2',
        tipo: 'Laptop',
        img: '/uploads/modelos/_EliteBook_Folio_1040_G2.jpg', // Ruta pública a la imagen
      },
      {
        nombre: '14-AC186LA',
        tipo: 'Laptop',
        img: '/uploads/modelos/14-ac186la.jpg',
      },
      {
        nombre: '15 Notebook PC',
        tipo: 'Laptop',
        img: '/uploads/modelos/hp15.png',
      },
      {
        nombre: '240 G4 Notebook PC',
        tipo: 'Laptop',
        img: '/uploads/modelos/240-g4.png',
      },
      {
        nombre: 'Compaq 500B MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/compaq-500b.jpg',
      },
      {
        nombre: '340 G1',
        tipo: 'Laptop',
        img: '/uploads/modelos/340g1.png',
      },
     {
        nombre: 'Compaq CQ2951LA',
        tipo: 'Desktop',
        img: '/uploads/modelos/Compaq-CQ2951LA.jpg',
      },
     {
        nombre: 'Compaq CQ5613LA',
        tipo: 'Desktop',
        img: '/uploads/modelos/Compaq-CQ5613LA.jpg',
      },
     {
        nombre: 'Compaq DX2200 MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/HP-Compaq-DX2200.jpg',
      },
     {
        nombre: 'Compaq DX2400 MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/dx2400.jpg',
      },
     {
        nombre: 'Compaq Presario CQ43',
        tipo: 'Laptop',
        img: '/uploads/modelos/cq43.jpg',
      },
      {
        nombre: 'CQ5000',
        tipo: 'Desktop',
        img: '/uploads/modelos/cq500.jpg',
      },
     {
        nombre: 'Elitebook 1040 G3',
        tipo: 'Laptop',
        img: '/uploads/modelos/1040-g3.jpg',
      },
     {
        nombre: 'G4-2050LA',
        tipo: 'Laptop',
        img: '/uploads/modelos/Pavilion_G4_1.png',
      },
     {
        nombre: 'G42-270LA',
        tipo: 'Laptop',
        img: '/uploads/modelos/G42-265la.png',
      },
     {
        nombre: 'Pro 3400 Series MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/3400-MT.jpg',
      },
     {
        nombre: 'Pro 3500 Series MT',
        tipo: 'Desktop',
        img: '/uploads/modelos/3500-mt.jpg',
      },
     {
        nombre: 'G42-270LA',
        tipo: 'Laptop',
        img: '/uploads/modelos/G42-265la.png',
      },
     {
        nombre: 'Probook 440 G10',
        tipo: 'Laptop',
        img: '/uploads/modelos/probook-440-g10',
      },
     {
        nombre: 'Probook 440 G2',
        tipo: 'Laptop',
        img: '/uploads/modelos/probook-440-g2.jpg',
      },
     {
        nombre: 'Probook 440 G8',
        tipo: 'Laptop',
        img: '/uploads/modelos/HP-ProBook-440-G8.jpg',
      },
     {
        nombre: 'Probook 450 G3',
        tipo: 'Laptop',
        img: '/uploads/modelos/HP_Probook_450_G3.jpg',
      },
     {
        nombre: 'Probook 450 G7',
        tipo: 'Laptop',
        img: '/uploads/modelos/450-g7.jpg',
      },
     {
        nombre: 'Probook 450 G8',
        tipo: 'Laptop',
        img: '/uploads/modelos/450-g8.jpg',
      },
     {
        nombre: 'ProDesk 400 G3 SFF',
        tipo: 'Desktop',
        img: '/uploads/modelos/ProDesk-400.jpg',
      },
     {
        nombre: 'Z420 Workstation',
        tipo: 'Desktop',
        img: '/uploads/modelos/z420.jpg',
      },
     {
        nombre: '240 G1 Notebook PC  ',
        tipo: 'Desktop',
        img: '/uploads/modelos/240-g1.jpg',
      },
    ],
  },
  {
    nombre: 'Dell',
    modelos: [
      {
        nombre: 'XPS',
        tipo: 'Laptop',
        img: '/uploads/modelos/dellXps.jpg',
      },
      {
        nombre: 'Inspiron 14',
        tipo: 'Laptop',
        img: '/uploads/modelos/inspiron14.jpg',
      },
      {
        nombre: 'Inspiron 15',
        tipo: 'Laptop',
        img: '/uploads/modelos/Dell-Inspiron-15.jpg',
      },
      {
        nombre: 'Inspiron 15 3000 3511',
        tipo: 'Laptop',
        img: '/uploads/modelos/Inspiron-3511.jpg',
      },     
      {
        nombre: 'Inspiron 15 3000 3520',
        tipo: 'Laptop',
        img: '/uploads/modelos/Inspiron-3520.jpg',
      },
      {
        nombre: 'Inspiron 3421',
        tipo: 'Laptop',
        img: '/uploads/modelos/Inspiron-3421.jpg',
      },
      {
        nombre: 'Inspiron 3420',
        tipo: 'Laptop',
        img: '/uploads/modelos/Latitude-3420.png',
      },
      {
        nombre: 'OptiPlex 3050',
        tipo: 'Desktop',
        img: '/uploads/modelos/optiplex-3050.jpg',
      },
      {
        nombre: 'Vostro 3268',
        tipo: 'Desktop',
        img: '/uploads/modelos/dell-vostro-3268.jpg',
      },
    ],
  },
  {
    nombre:  'Lenovo',
    modelos: [
        {
            nombre: '8215358',
            tipo: 'Desktop',
            img: '/uploads/modelos/M4L-80061303-lg.jpg',
        },
        {
            nombre: 'G50-70',
            tipo: 'Laptop',
            img: '/uploads/modelos/g50-70.jpg',
        },
        {
            nombre: 'E430',
            tipo: 'Laptop',
            img: '/uploads/modelos/lenovo-e430.jpg',
        },
        {
            nombre: 'G70-70',
            tipo: 'Laptop',
            img: '/uploads/modelos/g70-70.jpg',
        },
        {
            nombre: 'B40-80',
            tipo: 'Laptop',
            img: '/uploads/modelos/b40-80-01.jpg',
        },
        {
            nombre: 'B590 20208',
            tipo: 'Laptop',
            img: '/uploads/modelos/920942-3.jpg',
        },
        {
            nombre: 'ThinkCenter 35972H0',
            tipo: 'Desktop',
            img: '/uploads/modelos/35972.jpg',
        },
    ]
  }
  // Agrega más marcas y modelos aquí
];

async function main() {
  console.log('Iniciando el script de semilla para Marcas y Modelos...');

  for (const marcaData of datosDeInventario) {
    // Usamos `upsert` para evitar crear marcas duplicadas si el script se ejecuta de nuevo.
    // Busca una marca por su nombre único.
    const marca = await prisma.marca.upsert({
      where: { nombre: marcaData.nombre },
      update: {}, // No hacemos nada si ya existe
      create: {
        nombre: marcaData.nombre,
      },
    });

    console.log(`Marca procesada: ${marca.nombre} (ID: ${marca.id})`);

    // Ahora, para cada modelo de esta marca, lo creamos y lo asociamos.
    for (const modeloData of marcaData.modelos) {
      // Primero buscamos si existe el modelo por nombre y marcaId
      const modeloExistente = await prisma.modeloDispositivo.findFirst({
        where: {
          nombre: modeloData.nombre,
          marcaId: marca.id,
        },
      });

      await prisma.modeloDispositivo.upsert({
        where: modeloExistente
          ? { id: modeloExistente.id }
          : { id: '' }, // id vacío nunca existirá, así que se creará
        update: {}, // No hacemos nada si ya existe
        create: {
          nombre: modeloData.nombre,
          tipo: modeloData.tipo,
          img: modeloData.img,
          marca: {
            connect: {
              id: marca.id,
            },
          },
        },
      });
      console.log(`  └─ Modelo creado: ${modeloData.nombre}`);
    }
  }

  console.log('¡Script de semilla completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Ocurrió un error durante la ejecución del script:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cierra la conexión de Prisma
    await prisma.$disconnect();
  });
