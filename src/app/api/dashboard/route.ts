import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Asegúrate que la ruta a prisma sea correcta

/**
 * GET /api/dashboard/stats
 *
 * Endpoint unificado para obtener todas las estadísticas necesarias para el dashboard de inventario.
 */
export async function GET() {
  try {
    // --- 1. CONTEOS ESPECÍFICOS (NUEVAS TARJETAS) ---
    const [
      retiredComputers,
      retiredDevices,
      assignedBams,
      assignedLaptops,
      assignedDesktops,
      reservedLaptops,
      reservedDesktops,
      totalComputersCount, // Total de computadores (Laptop + Desktop)
    ] = await Promise.all([
      prisma.computador.count({ where: { estado: "De Baja" } }),
      prisma.dispositivo.count({ where: { estado: "De Baja" } }),
      prisma.dispositivo.count({
        where: {
          estado: { equals: "Asignado", mode: 'insensitive' },
          modelo: {
            tipo: { contains: "BAM", mode: 'insensitive' }
          }
        }
      }),
      prisma.computador.count({
        where: {
          estado: { equals: "Asignado", mode: 'insensitive' },
          modelo: { tipo: "Laptop" }
        }
      }),
      prisma.computador.count({
        where: {
          estado: { equals: "Asignado", mode: 'insensitive' },
          modelo: { tipo: "Desktop" }
        }
      }),
      prisma.computador.count({
        where: {
          estado: { equals: "Resguardo", mode: 'insensitive' },
          modelo: { tipo: "Laptop" }
        }
      }),
      prisma.computador.count({
        where: {
          estado: { equals: "Resguardo", mode: 'insensitive' },
          modelo: { tipo: "Desktop" }
        }
      }),
      // Contar TODOS los computadores de tipo Laptop y Desktop
      prisma.computador.count({
        where: {
          modelo: { tipo: { in: ["Laptop", "Desktop"] } }
        }
      }),
    ]);

    const retiredEquipments = retiredComputers + retiredDevices;
    const assignedLaptopsDesktops = assignedLaptops + assignedDesktops;
    const reservedLaptopsDesktops = reservedLaptops + reservedDesktops;
    const totalComputers = totalComputersCount; // Usar el conteo correcto

    // --- 2. ESTADÍSTICAS POR GERENCIA ---
    // Obtenemos gerencias y sumamos sus computadores (Laptop/Desktop)
    const gerenciasRaw = await prisma.gerencia.findMany({
      include: {
        departamentos: {
          select: {
            _count: {
              select: {
                computadores: {
                  where: { modelo: { tipo: { in: ["Laptop", "Desktop"] } } }
                }
              }
            }
          }
        }
      }
    });

    const gerenciaStats = gerenciasRaw.map(g => {
      const total = g.departamentos.reduce((acc, curr) => acc + curr._count.computadores, 0);
      return { name: g.nombre, count: total };
    }).filter(g => g.count > 0).sort((a, b) => b.count - a.count);

    // --- 3. ESTADÍSTICAS POR SOCIEDAD ---
    // Agrupamos por sociedad a través de departamentos
    const deptosSociedad = await prisma.departamento.findMany({
      select: {
        sociedad: true,
        _count: {
          select: {
            computadores: {
              where: { modelo: { tipo: { in: ["Laptop", "Desktop"] } } }
            }
          }
        }
      }
    });

    const sociedadStatsMap = deptosSociedad.reduce((acc, curr) => {
      const soc = curr.sociedad || "Sin Sociedad";
      acc[soc] = (acc[soc] || 0) + curr._count.computadores;
      return acc;
    }, {} as Record<string, number>);

    const sociedadStats = Object.entries(sociedadStatsMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);


    // --- 4. ESTADÍSTICAS POR DEPARTAMENTO (MANTENIDO PERO FILTRADO POR LAPTOP/DESKTOP) ---
    const deptsData = await prisma.departamento.findMany({
      include: {
        _count: {
          select: {
            usuarios: true,
            computadores: {
              where: { modelo: { tipo: { in: ["Laptop", "Desktop"] } } }
            },
          },
        },
      },
    });

    const departmentStats = deptsData.map((dept) => ({
      name: dept.nombre,
      computers: dept._count.computadores,
      users: dept._count.usuarios,
      percentage:
        totalComputers > 0
          ? parseFloat(((dept._count.computadores / totalComputers) * 100).toFixed(1))
          : 0,
    })).filter(d => d.computers > 0).sort((a, b) => b.computers - a.computers);

    // --- 5. ACTIVIDAD RECIENTE (SIN CAMBIOS) ---
    const recentActivityRaw = await prisma.asignaciones.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        targetUsuario: { select: { nombre: true, apellido: true } },
        computador: { select: { serial: true, modelo: { select: { nombre: true } } } },
        dispositivo: { select: { serial: true, modelo: { select: { nombre: true } } } },
      },
    });

    const recentActivity = recentActivityRaw.map(activity => {
      let deviceName = "N/A";
      if (activity.itemType === "Computador" && activity.computador) {
        deviceName = `${activity.computador.modelo.nombre} (S/N: ${activity.computador.serial})`;
      } else if (activity.itemType === "Dispositivo" && activity.dispositivo) {
        deviceName = `${activity.dispositivo.modelo.nombre} (S/N: ${activity.dispositivo.serial})`;
      }

      return {
        id: activity.id,
        action: activity.actionType,
        device: deviceName,
        user: activity.targetUsuario ? `${activity.targetUsuario.nombre} ${activity.targetUsuario.apellido}` : 'Sistema',
        time: activity.createdAt.toISOString(),
        type: activity.actionType.toLowerCase().includes('asigna') ? 'assignment' : 'registration',
      }
    });

    // --- 6. TENDENCIAS (PLACEHOLDER) ---
    const trends = {
      retired: 2.1,
      bams: 5.4,
      assigned: 1.2,
      reserved: -0.5,
    };

    // --- 7. RESPUESTA FINAL ---
    return NextResponse.json({
      retiredEquipments,
      assignedBams,
      assignedLaptops,
      assignedDesktops,
      reservedLaptops,
      reservedDesktops,
      assignedLaptopsDesktops,
      reservedLaptopsDesktops,
      gerenciaStats,
      sociedadStats,
      departmentStats,
      recentActivity,
      totalComputers,
      trends,
    });

    console.log("datosBackend:", retiredEquipments,  assignedLaptopsDesktops,
      reservedLaptopsDesktops, totalComputers);

  } catch (error) {
    console.error("Error al obtener las estadísticas del dashboard:", error);
    // En caso de un error en la base de datos, devolvemos una respuesta de error 500.
    return new NextResponse(
      JSON.stringify({ message: "Error interno del servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}