import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

/**
 * GET /api/dashboard/stats
 *
 * Endpoint unificado para obtener todas las estadísticas necesarias para el dashboard de inventario.
 */
export async function GET() {
  // Solo usuarios autenticados pueden ver el dashboard
  const authError = await requireAuth();
  if (authError) return authError;
  
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
      prisma.lineaTelefonica.count({
        where: {
          destino: { equals: "BAM", mode: 'insensitive' },
          usuarioId: { not: null }
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

    // --- 2, 3, 4: ESTADÍSTICAS POR DEPARTAMENTO, GERENCIA Y SOCIEDAD ---
    // Se usa el departamento EFECTIVO de cada computador:
    //   - Si tiene departamentoId directo (asignado a departamento) → ese
    //   - Si tiene usuario con departamentoId (asignado a usuario) → el del usuario
    //   - Si no tiene ninguno → no se cuenta en estas stats
    const allComputers = await prisma.computador.findMany({
      where: {
        modelo: { tipo: { in: ["Laptop", "Desktop"] } }
      },
      select: {
        departamentoId: true,
        usuario: {
          select: { departamentoId: true }
        }
      }
    });

    // Contar computadores por departamento efectivo
    const deptCounts: Record<string, number> = {};
    for (const comp of allComputers) {
      const effectiveDeptId = comp.departamentoId || comp.usuario?.departamentoId;
      if (effectiveDeptId) {
        deptCounts[effectiveDeptId] = (deptCounts[effectiveDeptId] || 0) + 1;
      }
    }

    // Obtener todos los departamentos con su gerencia y conteo de usuarios
    const allDepts = await prisma.departamento.findMany({
      include: {
        gerencia: true,
        _count: { select: { usuarios: true } }
      }
    });

    const deptMap = new Map(allDepts.map(d => [d.id, d]));

    // --- DEPARTAMENTO STATS ---
    const departmentStats = allDepts
      .map(dept => ({
        name: dept.nombre,
        computers: deptCounts[dept.id] || 0,
        users: dept._count.usuarios,
        percentage: totalComputers > 0
          ? parseFloat((((deptCounts[dept.id] || 0) / totalComputers) * 100).toFixed(1))
          : 0,
      }))
      .filter(d => d.computers > 0)
      .sort((a, b) => b.computers - a.computers);

    // --- GERENCIA STATS ---
    const gerenciaCounts: Record<string, number> = {};
    for (const [deptId, count] of Object.entries(deptCounts)) {
      const dept = deptMap.get(deptId);
      if (dept) {
        gerenciaCounts[dept.gerencia.nombre] = (gerenciaCounts[dept.gerencia.nombre] || 0) + count;
      }
    }
    const gerenciaStats = Object.entries(gerenciaCounts)
      .map(([name, count]) => ({ name, count }))
      .filter(g => g.count > 0)
      .sort((a, b) => b.count - a.count);

    // --- SOCIEDAD STATS ---
    const sociedadCounts: Record<string, number> = {};
    for (const [deptId, count] of Object.entries(deptCounts)) {
      const dept = deptMap.get(deptId);
      if (dept) {
        const soc = dept.sociedad || "Sin Sociedad";
        sociedadCounts[soc] = (sociedadCounts[soc] || 0) + count;
      }
    }
    const sociedadStats = Object.entries(sociedadCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

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

  } catch (error) {
    console.error("Error al obtener las estadísticas del dashboard:", error);
    // En caso de un error en la base de datos, devolvemos una respuesta de error 500.
    return new NextResponse(
      JSON.stringify({ message: "Error interno del servidor." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}