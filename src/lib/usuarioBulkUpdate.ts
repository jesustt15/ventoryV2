import ExcelJS from 'exceljs';
import prisma from '@/lib/prisma';

export type UsuarioBulkRow = {
  legajo: number;
  cedula: string;
  nombre?: string | null;
  apellido?: string | null;
  cargo?: string | null;
  departamento?: string | null;
};

export type UsuarioBulkResultItem = {
  legajo: number;
  cedula: string;
  found: boolean;
  created: boolean;
  updated: boolean;
  message?: string;
  warning?: string;
};

export async function parseUsuarioExcel(buffer: Buffer): Promise<UsuarioBulkRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headerRow = worksheet.getRow(1);
  const headers: Record<string, number> = {};

  headerRow.eachCell((cell, colNumber) => {
    const key = String(cell.value ?? '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos

    if (!key) return;

    if (['legajo', 'nro legajo', 'numero legajo', 'no legajo'].includes(key)) {
      headers.legajo = colNumber;
    } else if (['cedula', 'cédula', 'ci', 'ced', 'documento'].includes(key)) {
      headers.cedula = colNumber;
    } else if (['nombre', 'nombres'].includes(key)) {
      headers.nombre = colNumber;
    } else if (['apellido', 'apellidos'].includes(key)) {
      headers.apellido = colNumber;
    } else if (['cargo', 'puesto', 'posicion', 'posición'].includes(key)) {
      headers.cargo = colNumber;
    } else if (['departamento', 'depto', 'area', 'área'].includes(key)) {
      headers.departamento = colNumber;
    }
  });

  if (!headers.legajo || !headers.cedula) {
    throw new Error(
      'El archivo debe tener columnas de legajo y cédula obligatorias.'
    );
  }

  const rows: UsuarioBulkRow[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const legajoValue = row.getCell(headers.legajo).value;
    const cedulaValue = row.getCell(headers.cedula).value;

    // Convertir legajo a número
    const legajo = legajoValue ? parseInt(String(legajoValue).trim()) : null;
    const cedula = cedulaValue ? String(cedulaValue).trim() : null;

    if (!legajo || !cedula) return;

    const toText = (idx?: number) =>
      idx ? String(row.getCell(idx).value ?? '').trim() || null : null;

    rows.push({
      legajo,
      cedula,
      nombre: toText(headers.nombre),
      apellido: toText(headers.apellido),
      cargo: toText(headers.cargo),
      departamento: toText(headers.departamento),
    });
  });

  return rows;
}

export async function applyUsuarioBulkUpdate(rows: UsuarioBulkRow[]) {
  if (rows.length === 0) {
    return {
      summary: {
        totalRows: 0,
        totalLegajosUnicos: 0,
        found: 0,
        created: 0,
        updated: 0,
        notFound: 0,
      },
      results: [] as UsuarioBulkResultItem[],
    };
  }

  const legajos = [...new Set(rows.map((r) => r.legajo))];

  // Buscar usuarios existentes por legajo
  const usuarios = await prisma.usuario.findMany({
    where: { legajo: { in: legajos } },
    include: { departamento: true },
  });

  const usuarioMap = new Map(usuarios.map((u) => [u.legajo, u]));

  // Obtener todos los departamentos para mapeo
  const departamentos = await prisma.departamento.findMany();
  const departamentoMap = new Map(
    departamentos.map((d) => [d.nombre.toLowerCase().trim(), d])
  );

  const results: UsuarioBulkResultItem[] = [];

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const existing = usuarioMap.get(row.legajo);

      let warningMsg = '';
      let messageMsg = '';

      // Buscar departamento si se proporciona
      let departamentoId: string | undefined = undefined;
      if (row.departamento) {
        const depto = departamentoMap.get(row.departamento.toLowerCase().trim());
        if (!depto) {
          warningMsg = `El departamento '${row.departamento}' no existe en la base de datos. `;
        } else {
          departamentoId = depto.id;
        }
      }

      // CASO 1: El usuario NO existe - CREAR
      if (!existing) {
        // Validar que tengamos los datos mínimos para crear
        if (!row.nombre || !row.apellido || !row.cargo || !departamentoId) {
          results.push({
            legajo: row.legajo,
            cedula: row.cedula,
            found: false,
            created: false,
            updated: false,
            message: 'Usuario no existe. Para crearlo se requiere: nombre, apellido, cargo y departamento válido.',
            warning: warningMsg || undefined,
          });
          continue;
        }

        // Crear el nuevo usuario
        await tx.usuario.create({
          data: {
            legajo: row.legajo,
            ced: row.cedula,
            nombre: row.nombre,
            apellido: row.apellido,
            cargo: row.cargo,
            departamentoId: departamentoId,
          },
        });

        results.push({
          legajo: row.legajo,
          cedula: row.cedula,
          found: false,
          created: true,
          updated: false,
          message: 'Usuario creado exitosamente.',
        });
        continue;
      }

      // CASO 2: El usuario EXISTE - ACTUALIZAR si hay cambios
      const dataToUpdate: any = {};

      if (row.cedula && row.cedula !== existing.ced) {
        dataToUpdate.ced = row.cedula;
      }
      if (row.nombre && row.nombre !== existing.nombre) {
        dataToUpdate.nombre = row.nombre;
      }
      if (row.apellido && row.apellido !== existing.apellido) {
        dataToUpdate.apellido = row.apellido;
      }
      if (row.cargo && row.cargo !== existing.cargo) {
        dataToUpdate.cargo = row.cargo;
      }
      if (departamentoId && departamentoId !== existing.departamentoId) {
        dataToUpdate.departamentoId = departamentoId;
        messageMsg += `Departamento cambiado de '${existing.departamento.nombre}' a '${row.departamento}'. `;
      }

      if (Object.keys(dataToUpdate).length === 0) {
        results.push({
          legajo: row.legajo,
          cedula: row.cedula,
          found: true,
          created: false,
          updated: false,
          message: 'Sin cambios respecto a la base de datos.',
          warning: warningMsg || undefined,
        });
        continue;
      }

      await tx.usuario.update({
        where: { id: existing.id },
        data: dataToUpdate,
      });

      results.push({
        legajo: row.legajo,
        cedula: row.cedula,
        found: true,
        created: false,
        updated: true,
        message: messageMsg + 'Usuario actualizado correctamente.',
        warning: warningMsg || undefined,
      });
    }
  });

  const summary = {
    totalRows: rows.length,
    totalLegajosUnicos: legajos.length,
    found: results.filter((r) => r.found).length,
    created: results.filter((r) => r.created).length,
    updated: results.filter((r) => r.updated).length,
    notFound: results.filter((r) => !r.found && !r.created).length,
  };

  return { summary, results };
}
