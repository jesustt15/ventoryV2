import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, HistorialModificaciones } from '@prisma/client';
import { requireAuth, requireAdmin } from '@/lib/api-auth';


export async function GET(request: NextRequest) {
  // Solo usuarios autenticados pueden ver computadores
  const authError = await requireAuth();
  if (authError) return authError;
  
  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado');

  // --- PASO 1: DEPURACIÓN ---
  console.log(`[API/COMPUTADOR] Parámetro 'asignado' recibido: ${asignado}`);

  let where: Prisma.ComputadorWhereInput = {};

  if (asignado === 'false') {
    // --- PASO 2: LÓGICA REFORZADA ---
    // Un equipo NO está asignado si AMBOS campos son null o vacíos.
    where = {
      AND: [
        { usuarioId: null },
        { departamentoId: null }
      ]
    };
  } else if (asignado === 'true') {
    where = {
      OR: [
        { usuarioId: { not: null } },
        { departamentoId: { not: null } },
      ],
    };
  }
  
  console.log(`[API/COMPUTADOR] Cláusula 'where' de Prisma construida:`, JSON.stringify(where, null, 2));
  try {
          await Promise.resolve();
  
        const id = request.nextUrl.pathname.split('/')[3];
        const computador = await prisma.computador.findUnique({
            where: { id },
            include: {
                modelo: {         // Incluye el objeto 'modelo' relacionado
                    include: {
                        marca: true // Dentro de 'modelo', incluye también la 'marca'
                    }
                },
                asignaciones: {
                  include: {
                    targetUsuario: true,
                    targetDepartamento: true
                  }
                },
                usuario: {
                  include:{
                      departamento: true // Incluye el objeto 'departamento' del usuario asignado (si existe)
                  }
                },      // Incluye el objeto 'usuario' asignado (si existe)
                departamento: {
                  include: {
                    gerencia: true, // Incluye la 'gerencia' del departamento (si existe)
                  }
                },
                historialModificaciones: {
                  orderBy: {
                      fecha: 'desc' // Ordenar por fecha, el más reciente primero
                  }
              }
            }
        });

        if (!computador) {
            return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
        }

      const historialDeAsignaciones = computador.asignaciones.map(a => ({
      id: `asig-${a.id}`, // Prefijo para evitar colisión de IDs
      tipo: 'asignacion', // Tipo para identificarlo en el frontend
      fecha: a.date,
      detalle: a, // Mantenemos el objeto original anidado
    }));

    const historialDeModificaciones = computador.historialModificaciones.map(m => ({
      id: `mod-${m.id}`, // Prefijo para evitar colisión de IDs
      tipo: 'modificacion', // Tipo para identificarlo en el frontend
      fecha: m.fecha,
      detalle: m, // Mantenemos el objeto original anidado
    }));

    // Combinar y ordenar el historial final
    const historialCombinado = [...historialDeAsignaciones, ...historialDeModificaciones]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

        // Construimos el objeto de respuesta final
        const responseData = {
            ...computador,      // Todos los datos del computador
            historial: historialCombinado,          // El array de historial que consultamos por separado
         // El objeto simplificado del último movimiento
        };


        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Solo admin puede modificar computadores
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    const id = request.nextUrl.pathname.split('/')[3];
    const body = await request.json();
    const normalizeOptionalString = (value: unknown): string | null => {
      if (value === undefined || value === null) return null;
      const str = String(value).trim();
      return str === '' ? null : str;
    };

    const normalizedData = {
      serial: body.serial,
      estado: body.estado,
      modeloId: body.modeloId,
      usuarioId: body.usuarioId,
      departamentoId: body.departamentoId,
      nsap: normalizeOptionalString(body.nsap),
      host: normalizeOptionalString(body.host),
      ubicacion: normalizeOptionalString(body.ubicacion),
      sisOperativo: normalizeOptionalString(body.sisOperativo),
      arquitectura: normalizeOptionalString(body.arquitectura),
      ram: normalizeOptionalString(body.ram),
      almacenamiento: normalizeOptionalString(body.almacenamiento),
      procesador: normalizeOptionalString(body.procesador),
      sapVersion: normalizeOptionalString(body.sapVersion),
      officeVersion: normalizeOptionalString(body.officeVersion),
      sede: normalizeOptionalString(body.sede),
      macWifi: normalizeOptionalString(body.macWifi),
      macEthernet: normalizeOptionalString(body.macEthernet),
      observacion: normalizeOptionalString(body.observacion),
    };

    // --- PASO 1: OBTENER EL ESTADO ACTUAL DEL COMPUTADOR ---
    const computadorActual = await prisma.computador.findUnique({
      where: { id },
    });

    if (!computadorActual) {
      return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
    }

    const modificaciones: Prisma.HistorialModificacionesCreateManyInput[] = [];
    const camposAComparar: (keyof typeof normalizedData)[] = [
      'ram', 'almacenamiento', 'procesador', 'estado', 'nsap',
      'host', 'ubicacion', 'sisOperativo', 'arquitectura', 'sapVersion', 'officeVersion','sede',
      'macWifi', 'macEthernet'
    ];

    // --- PASO 2: COMPARAR VALORES Y PREPARAR HISTORIAL ---
    for (const campo of camposAComparar) {
      if (normalizedData[campo] !== undefined && computadorActual[campo] !== normalizedData[campo]) {
        modificaciones.push({
          computadorId: id,
          campo: campo,
          valorAnterior: computadorActual[campo] || "N/A",
          valorNuevo: normalizedData[campo] || "N/A",
        });
      }
    }

    // --- PASO 3: EJECUTAR ACTUALIZACIÓN Y CREACIÓN DE HISTORIAL EN UNA TRANSACCIÓN ---
    const updatedEquipo = await prisma.$transaction(async (tx) => {
      // Si hay modificaciones, las creamos
      if (modificaciones.length > 0) {
        await tx.historialModificaciones.createMany({
          data: modificaciones,
        });
      }

      // Actualizamos el computador con todos los datos del body
      const equipoActualizado = await tx.computador.update({
        where: { id },
        data: {
            serial: normalizedData.serial,
            estado: normalizedData.estado,
            nsap: normalizedData.nsap,
            host: normalizedData.host,
            ubicacion: normalizedData.ubicacion,
            sisOperativo: normalizedData.sisOperativo,
            arquitectura: normalizedData.arquitectura,
            ram: normalizedData.ram,
            almacenamiento: normalizedData.almacenamiento,
            procesador: normalizedData.procesador,
            sapVersion: normalizedData.sapVersion,
            sede: normalizedData.sede,
            officeVersion: normalizedData.officeVersion,
            macWifi: normalizedData.macWifi,
            macEthernet: normalizedData.macEthernet,
            observacion: normalizedData.observacion,
            modelo: normalizedData.modeloId ? { connect: { id: normalizedData.modeloId } } : undefined,
            usuario: normalizedData.usuarioId ? { connect: { id: normalizedData.usuarioId } } : { disconnect: true },
            departamento: normalizedData.departamentoId ? { connect: { id: normalizedData.departamentoId } } : undefined, // Ajusta según tu lógica si puede ser null
        },
      });

      return equipoActualizado;
    });

    return NextResponse.json(updatedEquipo, { status: 200 });

  } catch (error) {
    console.error("[PUT /api/computador]", error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Solo admin puede eliminar computadores
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    await prisma.computador.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'Equipo eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar equipo' }, { status: 500 });
  }
}
