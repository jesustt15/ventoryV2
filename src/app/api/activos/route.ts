import prisma from '@/lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextResponse } from 'next/server';


export async function GET(request: Request, res: NextResponse) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");

    // Fetch computadores and dispositivos from Prisma
    const computadores = await prisma.computador.findMany({
      include: {
        modelo: {
          include: { marca: true }
        }
      }
    });
    const dispositivos = await prisma.dispositivo.findMany({
      include: {
        modelo: {
          include: { marca: true }
        }
      }
    });
    const todosLosActivos = [
      ...computadores.map(c => ({ ...c, itemType: "Computador" as const })),
      ...dispositivos.map(d => ({ ...d, itemType: "Dispositivo" as const })),
    ];

    const idsActivos = todosLosActivos.map(a => a.id);

    const ultimasAcciones = await prisma.asignaciones.findMany({
      where: {
        OR: [
          { computadorId: { in: idsActivos } },
          { dispositivoId: { in: idsActivos } }
        ]
      },
      orderBy: { date: "desc" },
      distinct: ["computadorId", "dispositivoId"],
      include: {
        targetUsuario: true,
        targetDepartamento: true
      }
    });

    const mapaAcciones = new Map(
      ultimasAcciones.map(a => [a.computadorId || a.dispositivoId, a])
    );

    let activosFiltrados = [];

    if (estado === "asignado") {
      activosFiltrados = todosLosActivos
        .filter(activo => {
          const accion = mapaAcciones.get(activo.id);
          return accion?.actionType === "Asignacion";
        })
        .map(activo => {
          const accion = mapaAcciones.get(activo.id)!;
          const asignadoA =
            accion.targetType === "Usuario"
              ? `${accion.targetUsuario?.nombre} ${accion.targetUsuario?.apellido}`
              : accion.targetDepartamento?.nombre;
          return {
            value: activo.id,
            label: `${activo.modelo.marca.nombre} ${activo.modelo.nombre} (Serial: ${activo.serial})`,
            type: activo.itemType,
            asignadoA: asignadoA ?? "Destino desconocido",
          };
        });
    } else {
      activosFiltrados = todosLosActivos
        .filter(activo => {
          const accion = mapaAcciones.get(activo.id);
          return !accion || accion.actionType === "Devolucion";
        })
        .map(activo => ({
          value: activo.id,
          label: `${activo.modelo.marca.nombre} ${activo.modelo.nombre} (Serial: ${activo.serial})`,
          type: activo.itemType,
        }));
    }

    return NextResponse.json(activosFiltrados);
  } catch (error) {
    console.error(`Error fetching activos:`, error);
    return NextResponse.json(
      { error: "Failed to fetch activos" },
      { status: 500 }
    );
  }
}