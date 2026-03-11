import ExcelJS from 'exceljs';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

export type BulkDispositivoRow = {
  serial: string;
  marca?: string | null;
  modelo?: string | null;
  tipo?: string | null;
  ubicacion?: string | null;
  estado?: string | null;
  sede?: string | null;
  usuario?: string | null;
  nsap?: string | null;
  imei?: string | null;
};

export type BulkDispositivoResultItem = {
  serial: string;
  found: boolean;
  updated: boolean;
  created: boolean;
  message?: string;
  warning?: string;
  usuarioExcel?: string | null;
  usuarioActual?: string | null;
  usuarioExiste?: boolean;
  marcaCreada?: boolean;
  modeloCreado?: boolean;
};

export async function parseExcel(buffer: ArrayBuffer | Uint8Array): Promise<BulkDispositivoRow[]> {
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
    } else if (['marca', 'brand'].includes(key)) {
      headers.marca = colNumber;
    } else if (['modelo', 'model'].includes(key)) {
      headers.modelo = colNumber;
    } else if (['tipo', 'type', 'categoria'].includes(key)) {
      headers.tipo = colNumber;
    } else if (['ubicacion', 'ubicación', 'location'].includes(key)) {
      headers.ubicacion = colNumber;
    } else if (['estado', 'status'].includes(key)) {
      headers.estado = colNumber;
    } else if (['sede', 'site'].includes(key)) {
      headers.sede = colNumber;
    } else if (['usuario', 'responsable', 'email', 'correo'].includes(key)) {
      headers.usuario = colNumber;
    } else if (['nsap', 'sap', 'n° sap', 'numero sap'].includes(key)) {
      headers.nsap = colNumber;
    } else if (['imei'].includes(key)) {
      headers.imei = colNumber;
    }
  });

  if (!headers.serial) {
    throw new Error('El archivo debe tener una columna de serial (serial / n° serie / no serie / serie).');
  }

  const rows: BulkDispositivoRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const serial = String(row.getCell(headers.serial).value ?? '').trim();
    if (!serial) return;

    const toText = (idx?: number) =>
      idx ? String(row.getCell(idx).value ?? '').trim() || null : null;

    rows.push({
      serial,
      marca: toText(headers.marca),
      modelo: toText(headers.modelo),
      tipo: toText(headers.tipo),
      ubicacion: toText(headers.ubicacion),
      estado: toText(headers.estado),
      sede: toText(headers.sede),
      usuario: toText(headers.usuario),
      nsap: toText(headers.nsap),
      imei: toText(headers.imei),
    });
  });

  return rows;
}

export async function applyDispositivoBulkUpdate(rows: BulkDispositivoRow[]) {
  if (rows.length === 0) {
    return {
      summary: {
        totalRows: 0,
        totalSerialesUnicos: 0,
        found: 0,
        updated: 0,
        created: 0,
        notFound: 0,
        serialesNoEncontrados: [],
        usuariosNoEncontrados: 0,
        incongruenciasUsuarios: 0,
        marcasCreadas: 0,
        modelosCreados: 0,
      },
      results: [] as BulkDispositivoResultItem[],
    };
  }

  const seriales = [...new Set(rows.map((r) => r.serial))];
  const normalizarNombre = (valor: string) => valor.trim().toLowerCase();

  // Extraer usuarios del Excel
  const usuariosExcel = [
    ...new Set(
      rows
        .map((r) => r.usuario)
        .filter(Boolean)
        .map((u) => normalizarNombre(u as string)),
    ),
  ];

  // Buscar dispositivos existentes
  const dispositivos = await prisma.dispositivo.findMany({
    where: { serial: { in: seriales } },
    include: { usuario: true, modelo: { include: { marca: true } } },
  });
  const dispositivoMap = new Map(dispositivos.map((d) => [d.serial, d]));

  // Buscar usuarios en BD
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

  const usuarioMap = new Map<string, { id: string; nombre: string; apellido: string }>();

  for (const u of usuariosDB) {
    const fullName = normalizarNombre(`${u.nombre} ${u.apellido}`);
    usuarioMap.set(fullName, { id: u.id, nombre: u.nombre, apellido: u.apellido });
    usuarioMap.set(normalizarNombre(u.nombre), { id: u.id, nombre: u.nombre, apellido: u.apellido });
  }

  const results: BulkDispositivoResultItem[] = [];
  let marcasCreadas = 0;
  let modelosCreados = 0;

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const existing = dispositivoMap.get(row.serial);
      let marcaCreada = false;
      let modeloCreado = false;

      // --- CASO 1: EL DISPOSITIVO NO EXISTE - CREAR SI HAY MARCA Y MODELO ---
      if (!existing) {
        if (!row.marca || !row.modelo) {
          results.push({
            serial: row.serial,
            found: false,
            updated: false,
            created: false,
            message: 'No existe en BD. Para crearlo, debe proporcionar marca y modelo en el Excel.',
            usuarioExcel: row.usuario,
            usuarioActual: null,
            usuarioExiste: row.usuario ? !!usuarioMap.get(normalizarNombre(row.usuario)) : undefined,
          });
          continue;
        }

        // Buscar o crear marca
        let marca = await tx.marca.findFirst({
          where: { nombre: { equals: row.marca, mode: 'insensitive' } },
        });

        if (!marca) {
          marca = await tx.marca.create({
            data: { nombre: row.marca },
          });
          marcaCreada = true;
          marcasCreadas++;
        }

        // Buscar o crear modelo
        let modelo = await tx.modeloDispositivo.findFirst({
          where: {
            nombre: { equals: row.modelo, mode: 'insensitive' },
            marcaId: marca.id,
          },
        });

        if (!modelo) {
          modelo = await tx.modeloDispositivo.create({
            data: {
              nombre: row.modelo,
              marcaId: marca.id,
              tipo: row.tipo || 'Otro',
            },
          });
          modeloCreado = true;
          modelosCreados++;
        }

        // Crear el dispositivo
        await tx.dispositivo.create({
          data: {
            serial: row.serial,
            modeloId: modelo.id,
            ubicacion: row.ubicacion,
            estado: row.estado || 'Resguardo',
            sede: row.sede,
            nsap: row.nsap,
            mac: row.imei, // IMEI se guarda en el campo mac
          },
        });

        let warningMsg = '';
        let usuarioExiste: boolean | undefined = undefined;

        if (row.usuario) {
          const userDataEnBD = usuarioMap.get(normalizarNombre(row.usuario));
          if (!userDataEnBD) {
            usuarioExiste = false;
            warningMsg = `El usuario '${row.usuario}' no existe en la base de datos. Dispositivo creado sin asignar.`;
          } else {
            usuarioExiste = true;
            warningMsg = `Dispositivo creado. Usuario '${row.usuario}' debe asignarse manualmente.`;
          }
        }

        results.push({
          serial: row.serial,
          found: false,
          updated: false,
          created: true,
          message: `Dispositivo creado exitosamente.${marcaCreada ? ' Marca creada.' : ''}${modeloCreado ? ' Modelo creado.' : ''}`,
          warning: warningMsg || undefined,
          usuarioExcel: row.usuario,
          usuarioActual: null,
          usuarioExiste,
          marcaCreada,
          modeloCreado,
        });
        continue;
      }

      // --- CASO 2: EL DISPOSITIVO EXISTE, REVISAMOS CAMBIOS ---
      const dataToUpdate: Prisma.DispositivoUncheckedUpdateInput = {};

      let warningMsg = '';
      const usuarioActualNombre = existing.usuario ? `${existing.usuario.nombre} ${existing.usuario.apellido}` : null;

      // Verificamos cambios básicos
      if (row.ubicacion !== null && row.ubicacion !== undefined && row.ubicacion !== existing.ubicacion) dataToUpdate.ubicacion = row.ubicacion;
      if (row.sede !== null && row.sede !== undefined && row.sede !== existing.sede) dataToUpdate.sede = row.sede;
      if (row.nsap !== null && row.nsap !== undefined && row.nsap !== existing.nsap) dataToUpdate.nsap = row.nsap;
      if (row.imei !== null && row.imei !== undefined && row.imei !== existing.mac) dataToUpdate.mac = row.imei;

      // Solo actualizamos estado si NO viene usuario en el Excel
      if (!row.usuario && row.estado !== null && row.estado !== undefined && row.estado !== existing.estado) {
        dataToUpdate.estado = row.estado;
      }

      // Verificamos el Usuario (solo para reportar, NO para actualizar)
      let usuarioExiste: boolean | undefined = undefined;
      if (row.usuario) {
        const userDataEnBD = usuarioMap.get(normalizarNombre(row.usuario));

        if (!userDataEnBD) {
          usuarioExiste = false;
          warningMsg = `El usuario '${row.usuario}' no existe en la base de datos. Debe crearlo o asignarlo manualmente.`;
        } else {
          usuarioExiste = true;
          if (userDataEnBD.id !== existing.usuarioId) {
            warningMsg = `Incongruencia: Excel indica '${row.usuario}' pero el dispositivo está asignado a '${usuarioActualNombre || 'Nadie'}'. Debe reasignar manualmente.`;
          }
        }
      }

      if (Object.keys(dataToUpdate).length === 0) {
        results.push({
          serial: row.serial,
          found: true,
          updated: false,
          created: false,
          message: 'Sin cambios en los datos básicos.',
          warning: warningMsg || undefined,
          usuarioExcel: row.usuario,
          usuarioActual: usuarioActualNombre,
          usuarioExiste,
        });
        continue;
      }

      // Ejecutamos la actualización
      await tx.dispositivo.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });

      results.push({
        serial: row.serial,
        found: true,
        updated: true,
        created: false,
        message: 'Datos básicos actualizados correctamente.',
        warning: warningMsg || undefined,
        usuarioExcel: row.usuario,
        usuarioActual: usuarioActualNombre,
        usuarioExiste,
      });
    }
  });

  // --- GENERACIÓN DEL REPORTE FINAL ---
  const serialesNoEncontrados = results.filter((r) => !r.found && !r.created).map((r) => r.serial);
  const usuariosNoEncontrados = results.filter((r) => r.usuarioExiste === false).length;
  const incongruenciasUsuarios = results.filter(
    (r) => r.found && r.usuarioExcel && r.usuarioExiste && r.warning?.includes('Incongruencia')
  ).length;

  const summary = {
    totalRows: rows.length,
    totalSerialesUnicos: seriales.length,
    found: results.filter((r) => r.found).length,
    updated: results.filter((r) => r.updated).length,
    created: results.filter((r) => r.created).length,
    notFound: serialesNoEncontrados.length,
    serialesFaltantes: serialesNoEncontrados,
    usuariosNoEncontrados,
    incongruenciasUsuarios,
    marcasCreadas,
    modelosCreados,
  };

  return { summary, results };
}
