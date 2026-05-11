import ExcelJS from 'exceljs';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/** Serial tal como viene en Excel (trazabilidad en reportes). */
export type BulkRow = {
  serial: string;
  /** Fila en el Excel (1 = encabezado); la primera fila de datos es 2. */
  excelRow: number;
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
  excelRow?: number;
  found: boolean;
  updated: boolean;
  message?: string;
  warning?: string;
  usuarioExcel?: string | null;
  usuarioActual?: string | null;
  usuarioExiste?: boolean;
};

const SERIAL_HEADER_KEYS = new Set([
  'serial',
  'n° serie',
  'no serie',
  'nº serie',
  'número de serie',
  'numero de serie',
  'serie',
  's/n',
  'sn',
  'asset tag',
  'tag',
  'service tag',
]);

const HOST_HEADER_KEYS = new Set(['host', 'hostname', 'nombre host', 'nombre de host', 'equipo']);
const UBICACION_HEADER_KEYS = new Set(['ubicacion', 'ubicación', 'location']);
const ESTADO_HEADER_KEYS = new Set(['estado', 'status']);
const SEDE_HEADER_KEYS = new Set(['sede', 'site']);
const USUARIO_HEADER_KEYS = new Set(['usuario', 'responsable', 'email', 'correo', 'asignado', 'asignado a']);
const SO_HEADER_KEYS = new Set(['sistema operativo', 'so', 'os', 'sisoperativo']);
const RAM_HEADER_KEYS = new Set(['ram', 'memoria']);
const STORAGE_HEADER_KEYS = new Set(['almacenamiento', 'disco', 'storage', 'hdd', 'ssd']);
const NSAP_HEADER_KEYS = new Set(['nsap', 'sap', 'n° sap', 'numero sap', 'número sap']);
const CPU_HEADER_KEYS = new Set(['procesador', 'cpu', 'processor']);
const MAC_WIFI_HEADER_KEYS = new Set(['mac wifi', 'macwifi', 'mac wi-fi', 'wifi']);
const MAC_ETH_HEADER_KEYS = new Set(['mac ethernet', 'macethernet', 'mac lan', 'ethernet']);

/** Quita acentos para reconocer encabezados aunque Excel use otra ortografía. */
function normalizeHeaderKey(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

/**
 * Clave de serial alineada con la expresión SQL de búsqueda secundaria
 * (espacios extremos, NBSP, caracteres de ancho cero, BOM).
 */
export function canonicalSerial(serial: string): string {
  return serial
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim();
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Convierte el valor de una celda Excel a texto estable (evita notación científica en seriales numéricos). */
function readCellText(cell: ExcelJS.Cell): string {
  const val = cell.value;

  if (val == null || val === '') return '';

  if (typeof val === 'number') {
    if (Number.isInteger(val) && Math.abs(val) <= Number.MAX_SAFE_INTEGER) {
      return String(Math.trunc(val));
    }
    return String(val);
  }

  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();

  if (typeof val === 'object') {
    const o = val as Record<string, unknown>;

    if ('result' in o && o.result != null && !('richText' in o)) {
      const r = o.result;
      if (typeof r === 'number' && Number.isInteger(r) && Math.abs(r) <= Number.MAX_SAFE_INTEGER) {
        return String(Math.trunc(r));
      }
      if (typeof r === 'string') return r;
      if (typeof r === 'number') return String(r);
      if (typeof r === 'boolean') return r ? 'true' : 'false';
    }

    if (Array.isArray(o.richText)) {
      return (o.richText as { text: string }[]).map((t) => t.text).join('');
    }

    if ('text' in o && typeof o.text === 'string') return o.text;
    if ('hyperlink' in o && o.hyperlink && typeof (o as { text?: string }).text === 'string') {
      return (o as { text: string }).text;
    }
  }

  return String(val);
}

function readCellTrimmed(worksheet: ExcelJS.Worksheet, rowNumber: number, colNumber?: number): string {
  if (!colNumber) return '';
  const cell = worksheet.getRow(rowNumber).getCell(colNumber);
  return readCellText(cell).trim();
}

/**
 * Expresión SQL equivalente a `canonicalSerial` para coincidir con filas ya guardadas con espacios raros.
 * Usa translate para quitar ZW* / BOM y NBSP, luego trim.
 */
function sqlSerialCanonicalColumn(): Prisma.Sql {
  return Prisma.sql`
    btrim(translate(translate(serial,
      chr(8203) || chr(8204) || chr(8205) || chr(65279), ''),
      chr(160), ' '))
  `;
}

async function findComputadoresByCanonicalSerials(
  canonicals: string[],
): Promise<Array<{ id: string; serial: string }>> {
  if (canonicals.length === 0) return [];

  const out: Array<{ id: string; serial: string }> = [];
  const seenId = new Set<string>();

  for (const ch of chunkArray(canonicals, 600)) {
    const rows = await prisma.$queryRaw<Array<{ id: string; serial: string }>>`
      SELECT id, serial FROM "Computador"
      WHERE ${sqlSerialCanonicalColumn()} IN (${Prisma.join(ch.map((c) => Prisma.sql`${c}`))})
    `;
    for (const r of rows) {
      if (!seenId.has(r.id)) {
        seenId.add(r.id);
        out.push(r);
      }
    }
  }

  return out;
}

export async function parseExcel(buffer: ArrayBuffer | Uint8Array): Promise<BulkRow[]> {
  const workbook = new ExcelJS.Workbook();
  const input = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  await workbook.xlsx.load(input as unknown as ExcelJS.Buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const headers: Record<string, number> = {};

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = normalizeHeaderKey(String(cell.value ?? ''));

    if (!key) return;

    if (SERIAL_HEADER_KEYS.has(key)) {
      headers.serial = colNumber;
    } else if (HOST_HEADER_KEYS.has(key)) {
      headers.host = colNumber;
    } else if (UBICACION_HEADER_KEYS.has(key)) {
      headers.ubicacion = colNumber;
    } else if (ESTADO_HEADER_KEYS.has(key)) {
      headers.estado = colNumber;
    } else if (SEDE_HEADER_KEYS.has(key)) {
      headers.sede = colNumber;
    } else if (USUARIO_HEADER_KEYS.has(key)) {
      headers.usuario = colNumber;
    } else if (SO_HEADER_KEYS.has(key)) {
      headers.sisOperativo = colNumber;
    } else if (RAM_HEADER_KEYS.has(key)) {
      headers.ram = colNumber;
    } else if (STORAGE_HEADER_KEYS.has(key)) {
      headers.almacenamiento = colNumber;
    } else if (NSAP_HEADER_KEYS.has(key)) {
      headers.nsap = colNumber;
    } else if (CPU_HEADER_KEYS.has(key)) {
      headers.procesador = colNumber;
    } else if (MAC_WIFI_HEADER_KEYS.has(key)) {
      headers.macWifi = colNumber;
    } else if (MAC_ETH_HEADER_KEYS.has(key)) {
      headers.macEthernet = colNumber;
    }
  });

  if (!headers.serial) {
    throw new Error(
      'El archivo debe incluir una columna de serial reconocible (serial, serie, s/n, número de serie, service tag, etc.).',
    );
  }

  const rows: BulkRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const serialRaw = readCellTrimmed(worksheet, rowNumber, headers.serial);
    if (!serialRaw) return;

    const serial = canonicalSerial(serialRaw);
    if (!serial) return;

    const toText = (idx?: number) => {
      const t = readCellTrimmed(worksheet, rowNumber, idx);
      return t || null;
    };

    rows.push({
      serial,
      excelRow: rowNumber,
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
        unchanged: 0,
        notFound: 0,
        notFoundRows: 0,
        serialesFaltantes: [] as string[],
        usuariosNoEncontrados: 0,
        incongruenciasUsuarios: 0,
      },
      results: [] as BulkResultItem[],
    };
  }

  const serialesExactFromExcel = [...new Set(rows.map((r) => r.serial))];

  const computadoresExact = await prisma.computador.findMany({
    where: { serial: { in: serialesExactFromExcel } },
    include: { usuario: true },
  });

  const byCanonical = new Map<string, (typeof computadoresExact)[0]>();
  for (const c of computadoresExact) {
    byCanonical.set(canonicalSerial(c.serial), c);
  }

  const canonFromRows = [...new Set(rows.map((r) => canonicalSerial(r.serial)))];
  const missingCanon = canonFromRows.filter((c) => !byCanonical.has(c));

  if (missingCanon.length > 0) {
    const foundLoose = await findComputadoresByCanonicalSerials(missingCanon);
    if (foundLoose.length > 0) {
      const full = await prisma.computador.findMany({
        where: { id: { in: foundLoose.map((f) => f.id) } },
        include: { usuario: true },
      });
      for (const c of full) {
        const k = canonicalSerial(c.serial);
        if (!byCanonical.has(k)) byCanonical.set(k, c);
      }
    }
  }

  const normalizarNombre = (valor: string) => valor.trim().toLowerCase();

  const usuariosExcel = [
    ...new Set(
      rows
        .map((r) => r.usuario)
        .filter(Boolean)
        .map((u) => normalizarNombre(u as string)),
    ),
  ];

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
      const canon = canonicalSerial(row.serial);
      const existing = byCanonical.get(canon);

      if (!existing) {
        results.push({
          serial: row.serial,
          excelRow: row.excelRow,
          found: false,
          updated: false,
          message:
            'No hay un computador con este serial en la base de datos (tras normalizar espacios y formato). Comprueba el serial en el inventario o crea el equipo antes de la carga masiva.',
          usuarioExcel: row.usuario,
          usuarioActual: null,
          usuarioExiste: row.usuario ? !!usuarioMap.get(normalizarNombre(row.usuario)) : undefined,
        });
        continue;
      }

      const dataToUpdate: Prisma.ComputadorUncheckedUpdateInput = {};

      let warningMsg = '';
      const usuarioActualNombre = existing.usuario
        ? `${existing.usuario.nombre} ${existing.usuario.apellido}`
        : null;

      if (row.host !== null && row.host !== undefined && row.host !== existing.host) dataToUpdate.host = row.host;
      if (row.ubicacion !== null && row.ubicacion !== undefined && row.ubicacion !== existing.ubicacion) {
        dataToUpdate.ubicacion = row.ubicacion;
      }
      if (row.sede !== null && row.sede !== undefined && row.sede !== existing.sede) dataToUpdate.sede = row.sede;
      if (row.sisOperativo !== null && row.sisOperativo !== undefined && row.sisOperativo !== existing.sisOperativo) {
        dataToUpdate.sisOperativo = row.sisOperativo;
      }
      if (row.ram !== null && row.ram !== undefined && row.ram !== existing.ram) dataToUpdate.ram = row.ram;
      if (row.almacenamiento !== null && row.almacenamiento !== undefined && row.almacenamiento !== existing.almacenamiento) {
        dataToUpdate.almacenamiento = row.almacenamiento;
      }
      if (row.nsap !== null && row.nsap !== undefined && row.nsap !== existing.nsap) dataToUpdate.nsap = row.nsap;
      if (row.procesador !== null && row.procesador !== undefined && row.procesador !== existing.procesador) {
        dataToUpdate.procesador = row.procesador;
      }
      if (row.macWifi !== null && row.macWifi !== undefined && row.macWifi !== existing.macWifi) {
        dataToUpdate.macWifi = row.macWifi;
      }
      if (row.macEthernet !== null && row.macEthernet !== undefined && row.macEthernet !== existing.macEthernet) {
        dataToUpdate.macEthernet = row.macEthernet;
      }

      if (!row.usuario && row.estado !== null && row.estado !== undefined && row.estado !== existing.estado) {
        dataToUpdate.estado = row.estado;
      }

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
          excelRow: row.excelRow,
          found: true,
          updated: false,
          message: 'Sin cambios en los datos básicos respecto a la base de datos.',
          warning: warningMsg || undefined,
          usuarioExcel: row.usuario,
          usuarioActual: usuarioActualNombre,
          usuarioExiste,
        });
        continue;
      }

      await tx.computador.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });

      results.push({
        serial: row.serial,
        excelRow: row.excelRow,
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

  const notFoundItems = results.filter((r) => !r.found);
  const serialesFaltantesUnicos = [...new Set(notFoundItems.map((r) => r.serial))];

  const usuariosNoEncontrados = results.filter((r) => r.usuarioExiste === false).length;
  const incongruenciasUsuarios = results.filter(
    (r) => r.found && r.usuarioExcel && r.usuarioExiste && r.warning?.includes('Incongruencia'),
  ).length;

  const summary = {
    totalRows: rows.length,
    totalSerialesUnicos: serialesExactFromExcel.length,
    found: results.filter((r) => r.found).length,
    updated: results.filter((r) => r.updated).length,
    unchanged: results.filter((r) => r.found && !r.updated).length,
    notFound: serialesFaltantesUnicos.length,
    notFoundRows: notFoundItems.length,
    serialesFaltantes: serialesFaltantesUnicos,
    usuariosNoEncontrados,
    incongruenciasUsuarios,
  };

  return { summary, results };
}
