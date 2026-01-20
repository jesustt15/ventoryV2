// scripts/migrar-computadores.ts

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Define la estructura esperada de una fila en tu CSV de computadores
interface ComputadorCSVRow {
  serial: string;
  estado: string;
  modelo_nombre: string;
  nsap?: string;
  host?: string;
  ubicacion?: string;
  sisOperativo?: string;
  arquitectura?: string;
  macWifi?: string;
  macEthernet?: string;
  ram?: string;
  almacenamiento?: string;
  procesador?: string;
  sapVersion?: string;
  officeVersion?: string;
}

async function main() {
  console.log('🚀 Iniciando migración de computadores...');

  // --- PASO 1: Cargar datos necesarios para las relaciones ---
  console.log('Obteniendo Modelos y Departamento de la base de datos...');

  // Carga los modelos y crea un mapa para búsqueda por nombre
  const modelos = await prisma.modeloDispositivo.findMany();
  const modeloMap = new Map(modelos.map(m => [m.nombre.trim().toLowerCase(), m.id]));

  if (modeloMap.size === 0) {
    console.error("❌ No se encontraron modelos en la base de datos. Asegúrate de que ya estén creados.");
    return;
  }
  console.log(`✅ ${modeloMap.size} modelos cargados en memoria.`);

  // Busca el departamento específico "Jefatura de IT & Comunicaciones"
  const departamentoTI = await prisma.departamento.findFirst({
    where: { nombre: 'Jefatura de IT & Comunicaciones' },
  });

  if (!departamentoTI) {
    console.error('❌ No se encontró el departamento "Jefatura de IT & Comunicaciones". Por favor, créalo primero.');
    return;
  }
  console.log(`✅ Departamento de TI encontrado con ID: ${departamentoTI.id}`);


  // --- PASO 2: Leer el archivo CSV y preparar los datos ---
  const csvFilePath = path.join(__dirname, 'compus.csv');
  const computadoresParaCrear: any[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({
        separator: ';', // Ajusta si tu separador es diferente (ej: ',')
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => value.trim()
      }))
      .on('data', (row: ComputadorCSVRow) => {
        // Busca el ID del modelo usando el nombre del CSV
        const modeloId = modeloMap.get(row.modelo_nombre.toLowerCase());

        if (!modeloId) {
          console.warn(`⚠️ ADVERTENCIA: Modelo "${row.modelo_nombre}" no encontrado para el serial ${row.serial}. Se omitirá esta fila.`);
          return; // Salta esta fila si el modelo no existe
        }

        // Prepara el objeto de datos del computador para Prisma
        const computadorData = {
          serial: row.serial,
          estado: row.estado,
          modeloId: modeloId, // ID del modelo encontrado
          departamentoId: departamentoTI.id, // ID del departamento fijo
          nsap: row.nsap || null,
          host: row.host || null,
          ubicacion: row.ubicacion || null,
          sisOperativo: row.sisOperativo || null,
          arquitectura: row.arquitectura || null,
          macWifi: row.macWifi || null,
          macEthernet: row.macEthernet || null,
          ram: row.ram || null,
          almacenamiento: row.almacenamiento || null,
          procesador: row.procesador || null,
          sapVersion: row.sapVersion || null,
          officeVersion: row.officeVersion || null,
        };

        computadoresParaCrear.push(computadorData);
      })
      .on('end', () => {
        console.log(`📑 Lectura del CSV completada. Se procesaron ${computadoresParaCrear.length} computadores.`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });

  // --- PASO 3: Insertar los computadores en la base de datos ---
  if (computadoresParaCrear.length > 0) {
    console.log('Insertando computadores en la base de datos...');

    // `createMany` para inserción masiva y eficiente
    const result = await prisma.computador.createMany({
      data: computadoresParaCrear,
      skipDuplicates: true, // Omite la inserción si un computador con el mismo 'serial' (que es @unique) ya existe
    });

    console.log(`🎉 ¡Migración completada! Se crearon ${result.count} nuevos computadores.`);
  } else {
    console.log('No hay computadores nuevos para insertar.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Ocurrió un error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Cierra la conexión de Prisma al finalizar
    await prisma.$disconnect();
  });