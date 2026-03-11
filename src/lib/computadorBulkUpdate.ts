import ExcelJS from 'exceljs';
import prisma from '@/lib/prisma';

export type BulkRow = {
  serial: string;
  host?: string | null;
  ubicacion?: string | null;
  estado?: string | null;
  sede?: string | null;
  usuario?: string | null;
  sisOperativo?: string | null;
  ram?: string | null;
  almacenamiento?: string | null;
  nsap?: string | null;
  procesador?: string | null;
  macWifi?: string | null;
  macEthernet?: string | null;
};

export type BulkResultItem = {
  serial: string;
  found: boolean;
  updated: boolean;
  message?: string;
  warning?: string;
  usuarioExcel?: string | null; // Usuario que venía en el Excel
  usuarioActual?: string | null; // Usuario actualmente asignado en BD
  usuarioExiste?: boolean; // Si el usuario del Excel existe en BD
};

export async function parseExcel(buffer: Buffer): Promise<BulkRow[]> {
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
      headers.usuario = colNumber;
    } else if (['sistema operativo', 'so', 'os', 'sisoperativo'].includes(key)) {
      headers.sisOperativo = colNumber;
    } else if (['ram', 'memoria'].includes(key)) {
      headers.ram = colNumber;
    } else if (['almacenamiento', 'disco', 'storage', 'hdd', 'ssd'].includes(key)) {
      headers.almacenamiento = colNumber;
    } else if (['nsap', 'sap', 'n° sap', 'numero sap'].includes(key)) {
      headers.nsap = colNumber;
    } else if (['procesador', 'cpu', 'processor'].includes(key)) {
      headers.procesador = colNumber;
    } else if (['mac wifi', 'macwifi', 'mac wi-fi', 'wifi'].includes(key)) {
      headers.macWifi = colNumber;
    } else if (['mac ethernet', 'macethernet', 'mac lan', 'ethernet'].includes(key)) {
      headers.macEthernet = colNumber;
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
      sisOperativo: toText(headers.sisOperativo),
      ram: toText(headers.ram),
      almacenamiento: toText(headers.almacenamiento),
      nsap: toText(headers.nsap),
      procesador: toText(headers.procesador),
      macWifi: toText(headers.macWifi),
      macEthernet: toText(headers.macEthernet),
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
        serialesNoEncontrados: [],
        usuariosNoEncontrados: 0,
        incongruenciasUsuarios: 0,
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
    include: { usuario: true },
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

  const usuarioMap = new Map<string, { id: string; nombre: string; apellido: string }>();

  for (const u of usuariosDB) {
    const fullName = normalizarNombre(`${u.nombre} ${u.apellido}`);
    usuarioMap.set(fullName, { id: u.id, nombre: u.nombre, apellido: u.apellido });
    usuarioMap.set(normalizarNombre(u.nombre), { id: u.id, nombre: u.nombre, apellido: u.apellido });
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
          usuarioExcel: row.usuario,
          usuarioActual: null,
          usuarioExiste: row.usuario ? !!usuarioMap.get(normalizarNombre(row.usuario)) : undefined,
        });
        continue;
      }

      // --- CASO 2: EL COMPUTADOR EXISTE, REVISAMOS CAMBIOS ---
      const dataToUpdate: Prisma.ComputadorUncheckedUpdateInput = {};

      let warningMsg = '';
      const usuarioActualNombre = existing.usuario ? `${existing.usuario.nombre} ${existing.usuario.apellido}` : null;

      // Verificamos cambios básicos (sin tocar usuarioId)
      if (row.host !== null && row.host !== undefined && row.host !== existing.host) dataToUpdate.host = row.host;
      if (row.ubicacion !== null && row.ubicacion !== undefined && row.ubicacion !== existing.ubicacion) dataToUpdate.ubicacion = row.ubicacion;
      if (row.sede !== null && row.sede !== undefined && row.sede !== existing.sede) dataToUpdate.sede = row.sede;
      if (row.sisOperativo !== null && row.sisOperativo !== undefined && row.sisOperativo !== existing.sisOperativo) dataToUpdate.sisOperativo = row.sisOperativo;
      if (row.ram !== null && row.ram !== undefined && row.ram !== existing.ram) dataToUpdate.ram = row.ram;
      if (row.almacenamiento !== null && row.almacenamiento !== undefined && row.almacenamiento !== existing.almacenamiento) dataToUpdate.almacenamiento = row.almacenamiento;
      if (row.nsap !== null && row.nsap !== undefined && row.nsap !== existing.nsap) dataToUpdate.nsap = row.nsap;
      if (row.procesador !== null && row.procesador !== undefined && row.procesador !== existing.procesador) dataToUpdate.procesador = row.procesador;
      if (row.macWifi !== null && row.macWifi !== undefined && row.macWifi !== existing.macWifi) dataToUpdate.macWifi = row.macWifi;
      if (row.macEthernet !== null && row.macEthernet !== undefined && row.macEthernet !== existing.macEthernet) dataToUpdate.macEthernet = row.macEthernet;

      // Solo actualizamos estado si NO viene usuario en el Excel (para no interferir con asignaciones manuales)
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
            warningMsg = `Incongruencia: Excel indica '${row.usuario}' pero el equipo está asignado a '${usuarioActualNombre || 'Nadie'}'. Debe reasignar manualmente.`;
          }
        }
      }

      if (Object.keys(dataToUpdate).length === 0) {
        results.push({
          serial: row.serial,
          found: true,
          updated: false,
          message: 'Sin cambios en los datos básicos.',
          warning: warningMsg || undefined,
          usuarioExcel: row.usuario,
          usuarioActual: usuarioActualNombre,
          usuarioExiste,
        });
        continue;
      }

      // Ejecutamos la actualización (solo datos básicos, NO usuario)
      await tx.computador.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });

      results.push({
        serial: row.serial,
        found: true,
        updated: true,
        message: 'Datos básicos actualizados correctamente.',
        warning: warningMsg || undefined,
        usuarioExcel: row.usuario,
        usuarioActual: usuarioActualNombre,
        usuarioExiste,
      });
    }
  });

  // --- GENERACIÓN DEL REPORTE FINAL ---
  const serialesNoEncontrados = results.filter((r) => !r.found).map((r) => r.serial);
  const usuariosNoEncontrados = results.filter((r) => r.usuarioExiste === false).length;
  const incongruenciasUsuarios = results.filter(
    (r) => r.found && r.usuarioExcel && r.usuarioExiste && r.warning?.includes('Incongruencia')
  ).length;

  const summary = {
    totalRows: rows.length,
    totalSerialesUnicos: seriales.length,
    found: results.filter((r) => r.found).length,
    updated: results.filter((r) => r.updated).length,
    notFound: serialesNoEncontrados.length,
    serialesFaltantes: serialesNoEncontrados,
    usuariosNoEncontrados,
    incongruenciasUsuarios,
  };

  return { summary, results };

}

