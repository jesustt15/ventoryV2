import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const id = request.nextUrl.pathname.split('/')[3];

  try {
    const gerencia = await prisma.gerencia.findUnique({
      where: { id },
      include: {
        gerente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cargo: true,
          },
        },
        departamentos: {
          include: {
            computadores: {
              include: {
                modelo: { include: { marca: true } },
                usuario: true,
                asignaciones: {
                  where: { itemType: 'Computador' },
                  orderBy: { date: 'desc' },
                  take: 1,
                },
              },
            },
            dispositivos: {
              include: {
                modelo: { include: { marca: true } },
                usuario: true,
                asignaciones: {
                  where: { itemType: 'Dispositivo' },
                  orderBy: { date: 'desc' },
                  take: 1,
                },
              },
            },
            usuarios: {
              include: {
                computadores: {
                  include: {
                    modelo: { include: { marca: true } },
                    asignaciones: {
                      where: { itemType: 'Computador' },
                      orderBy: { date: 'desc' },
                      take: 1,
                    },
                  },
                },
                dispositivos: {
                  include: {
                    modelo: { include: { marca: true } },
                    asignaciones: {
                      where: { itemType: 'Dispositivo' },
                      orderBy: { date: 'desc' },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!gerencia) {
      return NextResponse.json({ message: `Gerencia con ID ${id} no encontrada` }, { status: 404 });
    }

    const departamentosIds = gerencia.departamentos.map((d) => d.id);
    const usuariosIds = gerencia.departamentos.flatMap((d) => d.usuarios.map((u) => u.id));

    const lineasFilters = [];
    if (departamentosIds.length) {
      lineasFilters.push({ targetDepartamentoId: { in: departamentosIds } });
    }
    if (usuariosIds.length) {
      lineasFilters.push({ targetUsuarioId: { in: usuariosIds } });
    }

    const lineasAsignadas = await prisma.asignaciones.findMany({
      where: {
        itemType: 'LineaTelefonica',
        actionType: 'Asignacion',
        ...(lineasFilters.length ? { OR: lineasFilters } : { id: -1 }),
      },
      include: {
        lineaTelefonica: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    const lineasTelefonicas = lineasAsignadas
      .map((a) => ({
        ...a.lineaTelefonica,
        fechaAsignacion: a.date,
      }))
      .filter((l): l is NonNullable<typeof l> => l !== null);

    const computadores = [
      ...gerencia.departamentos.flatMap((depto) =>
        depto.computadores.map((comp) => ({
          ...comp,
          departamento: { id: depto.id, nombre: depto.nombre },
          fechaAsignacion: comp.asignaciones[0]?.date || null,
          asignaciones: undefined,
        })),
      ),
      ...gerencia.departamentos.flatMap((depto) =>
        depto.usuarios.flatMap((usuario) =>
          usuario.computadores.map((comp) => ({
            ...comp,
            usuario,
            departamento: { id: depto.id, nombre: depto.nombre },
            fechaAsignacion: comp.asignaciones[0]?.date || null,
            asignaciones: undefined,
          })),
        ),
      ),
    ];

    const dispositivos = [
      ...gerencia.departamentos.flatMap((depto) =>
        depto.dispositivos.map((disp) => ({
          ...disp,
          departamento: { id: depto.id, nombre: depto.nombre },
          fechaAsignacion: disp.asignaciones[0]?.date || null,
          asignaciones: undefined,
        })),
      ),
      ...gerencia.departamentos.flatMap((depto) =>
        depto.usuarios.flatMap((usuario) =>
          usuario.dispositivos.map((disp) => ({
            ...disp,
            usuario,
            departamento: { id: depto.id, nombre: depto.nombre },
            fechaAsignacion: disp.asignaciones[0]?.date || null,
            asignaciones: undefined,
          })),
        ),
      ),
    ];

    const computadoresUnicos = [...new Map(computadores.map((c) => [c.id, c])).values()];
    const dispositivosUnicos = [...new Map(dispositivos.map((d) => [d.id, d])).values()];
    const lineasUnicas = [...new Map(lineasTelefonicas.map((l) => [l.id, l])).values()];

    return NextResponse.json(
      {
        id: gerencia.id,
        nombre: gerencia.nombre,
        gerente: gerencia.gerente,
        departamentos: gerencia.departamentos.map((depto) => ({
          id: depto.id,
          nombre: depto.nombre,
        })),
        computadores: computadoresUnicos,
        dispositivos: dispositivosUnicos,
        lineasTelefonicas: lineasUnicas,
        estadisticas: {
          totalDepartamentos: gerencia.departamentos.length,
          totalComputadores: computadoresUnicos.length,
          totalDispositivos: dispositivosUnicos.length,
          totalLineas: lineasUnicas.length,
          totalActivos: computadoresUnicos.length + dispositivosUnicos.length + lineasUnicas.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Error al obtener activos para la gerencia ${id}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido en el servidor';
    return NextResponse.json({ message: 'Error al obtener los activos asignados', error: errorMessage }, { status: 500 });
  }
}
