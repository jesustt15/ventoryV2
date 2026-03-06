import ExcelJS from 'exceljs';
import prisma from '@/lib/prisma';

export type BulkRow = {
  serial: string;
  host?: string | null;
  ubicacion?: string | null;
  estado?: string | null;
  sede?: string | null;
};

export type BulkResultItem = {
  serial: string;
  found: boolean;
  updated: boolean;
  message?: string;
};

export async function parseExcel(buffer: Buffer): Promise<BulkRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const headers: Record<string, number> = {};

  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value ?? '')
      .toLowerCase()
      .trim();

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
    }
  });

  if (!headers.serial) {
    throw new Error(
      'El archivo debe tener una columna de serial (serial / n° serie / no serie / serie).'
    );
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
      },
      results: [] as BulkResultItem[],
    };
  }

  const seriales = [...new Set(rows.map((r) => r.serial))];

  const computadores = await prisma.computador.findMany({
    where: { serial: { in: seriales } },
  });

  const computadorMap = new Map(computadores.map((c) => [c.serial, c]));

  const results: BulkResultItem[] = [];

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const existing = computadorMap.get(row.serial);

      if (!existing) {
        results.push({
          serial: row.serial,
          found: false,
          updated: false,
          message: 'No existe un computador con este serial.',
        });
        continue;
      }

      const dataToUpdate: Partial<{
        host: string | null;
        ubicacion: string | null;
        estado: string | null;
        sede: string | null;
      }> = {};

      if (row.host !== null && row.host !== undefined && row.host !== existing.host) {
        dataToUpdate.host = row.host;
      }
      if (
        row.ubicacion !== null &&
        row.ubicacion !== undefined &&
        row.ubicacion !== existing.ubicacion
      ) {
        dataToUpdate.ubicacion = row.ubicacion;
      }
      if (row.estado !== null && row.estado !== undefined && row.estado !== existing.estado) {
        dataToUpdate.estado = row.estado;
      }
      if (row.sede !== null && row.sede !== undefined && row.sede !== existing.sede) {
        dataToUpdate.sede = row.sede;
      }

      if (Object.keys(dataToUpdate).length === 0) {
        results.push({
          serial: row.serial,
          found: true,
          updated: false,
          message: 'Sin cambios respecto a la base de datos.',
        });
        continue;
      }

      await tx.computador.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });

      results.push({
        serial: row.serial,
        found: true,
        updated: true,
      });
    }
  });

  const summary = {
    totalRows: rows.length,
    totalSerialesUnicos: seriales.length,
    found: results.filter((r) => r.found).length,
    updated: results.filter((r) => r.updated).length,
    notFound: results.filter((r) => !r.found).length,
  };

  return { summary, results };
}

