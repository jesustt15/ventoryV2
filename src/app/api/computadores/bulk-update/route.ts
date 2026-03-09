import ExcelJS from 'exceljs';
import prisma from '@/lib/prisma'; // O la ruta correcta a tu instancia de Prisma
import type { Prisma } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export type BulkRow = {
  serial: string;
  host?: string | null;
  ubicacion?: string | null;
  estado?: string | null;
  sede?: string | null;
  usuario?: string | null; // Agregamos el usuario (ej: correo o username del Excel)
};

export type BulkResultItem = {
  serial: string;
  found: boolean;
  updated: boolean;
  message?: string;
  warning?: string; // Nuevo campo para advertencias (ej: usuario no existe)
};

export async function parseExcel(buffer: ArrayBuffer | Uint8Array): Promise<BulkRow[]> {
  const workbook = new ExcelJS.Workbook();
  const input = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  await workbook.xlsx.load(input as any);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const headers: Record<string, number> = {};

  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value ?? '').toLowerCase().trim();

    if (!key) return;

    if (['serial', 'n° serie', 'no serie', 'serie'].includes(key)) {
      headers.serial = colNumber;
    } else if (['host', 'hostname', 'nombre host', 'nombre de host'].includes(key)) {
      headers.host = colNumber;
    } else if (['ubicacion', 'ubicación', 'location'].includes(key)) {
      headers.ubicacion = colNumber;
    } else if (['estado', 'status'].includes(key)) {
      headers.estado = colNumber;
    } else if (['sede', 'site'].includes(key)) {
      headers.sede = colNumber;
    } else if (['usuario', 'responsable', 'email', 'correo'].includes(key)) {
      headers.usuario = colNumber; // Detectamos la columna del usuario
    }
  });

  if (!headers.serial) {
    throw new Error('El archivo debe tener una columna de serial (serial / n° serie / no serie / serie).');
  }

  const rows: BulkRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const serial = String(row.getCell(headers.serial).value ?? '').trim();
    if (!serial) return;

    const toText = (idx?: number) =>
      idx ? String(row.getCell(idx).value ?? '').trim() || null : null;

    rows.push({
      serial,
      host: toText(headers.host),
      ubicacion: toText(headers.ubicacion),
      estado: toText(headers.estado),
      sede: toText(headers.sede),
      usuario: toText(headers.usuario),
    });
  });

  return rows;
}

export async function applyComputadorBulkUpdate(rows: BulkRow[]) {
  if (rows.length === 0) {
    return {
      summary: {
        totalRows: 0,
        totalSerialesUnicos: 0,
        found: 0,
        updated: 0,
        notFound: 0,
        serialesNoEncontrados: [], // Lo agregamos al reporte vacío
      },
      results: [] as BulkResultItem[],
    };
  }

  const seriales = [...new Set(rows.map((r) => r.serial))];

  // 1. Extraemos los nombres de usuario del Excel para buscarlos en la BD
  const normalizarNombre = (valor: string) => valor.trim().toLowerCase();

  const usuariosExcel = [
    ...new Set(
      rows
        .map((r) => r.usuario)
        .filter(Boolean)
        .map((u) => normalizarNombre(u as string)),
    ),
  ];

  // 2. Buscamos los Computadores (Incluyendo al usuario actual para comparar)
  const computadores = await prisma.computador.findMany({
    where: { serial: { in: seriales } },
    include: { usuario: true }, // Asegúrate de que la relación se llame así en tu schema
  });
  const computadorMap = new Map(computadores.map((c) => [c.serial, c]));

  // 3. Buscamos los Usuarios en la BD usando nombre y apellido
  const condicionesUsuarios =
    usuariosExcel.length === 0
      ? []
      : usuariosExcel.map((nombrePlano) => {
          const partes = nombrePlano.split(/\s+/).filter(Boolean);
          if (partes.length === 1) {
            return {
              nombre: {
                equals: partes[0],
                mode: 'insensitive' as const,
              },
            };
          }

          const nombre = partes[0];
          const apellido = partes.slice(1).join(' ');

          return {
            AND: [
              {
                nombre: {
                  equals: nombre,
                  mode: 'insensitive' as const,
                },
              },
              {
                apellido: {
                  equals: apellido,
                  mode: 'insensitive' as const,
                },
              },
            ],
          };
        });

  const usuariosDB =
    condicionesUsuarios.length === 0
      ? []
      : await prisma.usuario.findMany({
          where: {
            OR: condicionesUsuarios,
          },
        });

  const usuarioMap = new Map<string, string>();

  for (const u of usuariosDB) {
    const fullName = normalizarNombre(`${u.nombre} ${u.apellido}`);
    usuarioMap.set(fullName, u.id);
    usuarioMap.set(normalizarNombre(u.nombre), u.id);
  }

  const results: BulkResultItem[] = [];

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const existing = computadorMap.get(row.serial);

      // --- CASO 1: EL COMPUTADOR NO EXISTE ---
      if (!existing) {
        results.push({
          serial: row.serial,
          found: false,
          updated: false,
          message: 'No existe un computador con este serial en la Base de Datos.',
        });
        continue;
      }

      // --- CASO 2: EL COMPUTADOR EXISTE, REVISAMOS CAMBIOS ---
      const dataToUpdate: Prisma.ComputadorUncheckedUpdateInput = {};

      let warningMsg = '';
      let messageMsg = '';
      let usuarioAsignadoId: string | null = null;

      // Verificamos cambios básicos
      if (row.host !== null && row.host !== undefined && row.host !== existing.host) dataToUpdate.host = row.host;
      if (row.ubicacion !== null && row.ubicacion !== undefined && row.ubicacion !== existing.ubicacion) dataToUpdate.ubicacion = row.ubicacion;
      if (row.estado !== null && row.estado !== undefined && row.estado !== existing.estado) dataToUpdate.estado = row.estado;
      if (row.sede !== null && row.sede !== undefined && row.sede !== existing.sede) dataToUpdate.sede = row.sede;

      // Verificamos el Usuario
      if (row.usuario) {
        const userIdEnBD = usuarioMap.get(normalizarNombre(row.usuario));

        if (!userIdEnBD) {
          warningMsg = `El usuario '${row.usuario}' del Excel no existe en la tabla Usuarios. No se modificó su asignación.`;
        } else if (userIdEnBD !== existing.usuarioId) {
          // Si el usuario existe en BD pero es diferente al que tiene la laptop asignada, lo actualizamos
          dataToUpdate.usuarioId = userIdEnBD;
          dataToUpdate.estado = 'Asignado';
          usuarioAsignadoId = userIdEnBD;
          messageMsg = `Usuario reasignado (Antes: ${existing.usuario?.nombre || 'Nadie'} -> Ahora: ${row.usuario}). `;
        }
      }

      if (Object.keys(dataToUpdate).length === 0) {
        results.push({
          serial: row.serial,
          found: true,
          updated: false,
          message: 'Sin cambios respecto a la base de datos.',
          warning: warningMsg || undefined,
        });
        continue;
      }

      // Ejecutamos la actualización
      await tx.computador.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });

      // Registramos en la tabla de Asignaciones si hubo asignación de usuario
      if (usuarioAsignadoId) {
        await tx.asignaciones.create({
          data: {
            actionType: 'Asignación masiva',
            targetType: 'Usuario',
            itemType: 'Computador',
            targetUsuarioId: usuarioAsignadoId,
            computadorId: existing.id,
          },
        });
      }

      results.push({
        serial: row.serial,
        found: true,
        updated: true,
        message: messageMsg + 'Equipo actualizado correctamente.',
        warning: warningMsg || undefined,
      });
    }
  });

  // --- GENERACIÓN DEL REPORTE FINAL ---
  const serialesNoEncontrados = results.filter((r) => !r.found).map((r) => r.serial);

  const summary = {
    totalRows: rows.length,
    totalSerialesUnicos: seriales.length,
    found: results.filter((r) => r.found).length,
    updated: results.filter((r) => r.updated).length,
    notFound: serialesNoEncontrados.length,
    serialesFaltantes: serialesNoEncontrados, // ¡Aquí tienes tu lista exacta!
  };

  // Retornamos todo
  return { summary, results };
}

// Handler HTTP para Next.js App Router
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo en el campo "file".' },
        { status: 400 },
      );
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const rows = await parseExcel(arrayBuffer);
    const result = await applyComputadorBulkUpdate(rows);
    console.log(result);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error en bulk-update:', error);
    return NextResponse.json(
      { error: 'Error procesando el archivo de carga masiva.', detail: error?.message },
      { status: 500 },
    );
  }
}

