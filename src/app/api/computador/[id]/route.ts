import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { Prisma } from '@prisma/client';


export async function GET(request: NextRequest) {
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
            }
        });

        if (!computador) {
            return NextResponse.json({ message: 'Computador no encontrado' }, { status: 404 });
        }

        const historial = await prisma.asignaciones.findMany({
            where: {
                computadorId: id,// Importante para no mezclar con dispositivos
            },
            orderBy: {
                date: 'desc' // El más reciente primero
            },
          include: {
            targetUsuario: {
              select: { nombre: true, apellido: true }
            },
            targetDepartamento: {
              select: { nombre: true }
            }
          }
        });

        // --- PASO 3: Combinar los datos para enviar al frontend ---

        // Tomamos el primer elemento del historial (el más reciente) para la "última asignación"
        const ultimaAsignacion = historial.length > 0 ? {
            id: historial[0].id,
            type: historial[0].motivo,
            targetType: historial[0].targetType,
            
            date: historial[0].date.toISOString(),
        } : null;

        // Construimos el objeto de respuesta final
        const responseData = {
            ...computador,      // Todos los datos del computador
            historial,          // El array de historial que consultamos por separado
            ultimaAsignacion    // El objeto simplificado del último movimiento
        };

        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const body = await request.json();
    const {
      serial,
      estado,
      modeloId,
      usuarioId,
      departamentoId,
      nsap,
      host,
      ubicacion,
      sisOperativo,
      arquitectura,
      ram,
      almacenamiento,
      procesador,
      sapVersion,
      officeVersion,
  } = body;

const updatedEquipo = await prisma.computador.update({
  where: { id },
  data: {
    // simple scalars
    serial,
    estado,
    nsap,
    host,
    ubicacion,
    sisOperativo,
    arquitectura,
    ram,
    almacenamiento,
    procesador,
    sapVersion,
    officeVersion,

    // relation: connect an existing Modelo by its ID
    modelo: {
      connect: { id: modeloId },
    },

    // relation: if usuarioId is present, connect; if null, disconnect
    ...(usuarioId
      ? { usuario: { connect: { id: usuarioId } } }
      : { usuario: { disconnect: true } }),

    // relation: connect Departamento
    departamento: {
      connect: { id: departamentoId },
    },
  },
})
    return NextResponse.json(updatedEquipo, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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
