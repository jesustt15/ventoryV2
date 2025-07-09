import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado");
    const modeloId = searchParams.get("modeloId");
    const proveedor = searchParams.get("proveedor");

    // =================================================================================
    // Bloque 1: Filtrado específico para la selección guiada (por Modelo)
    // =================================================================================
    if (modeloId) {
      // Para esta búsqueda, solo necesitamos activos realmente disponibles.
      // La forma más rápida es verificar que no tengan un ID de asignación.
      // NOTA: Esta lógica asume que tu modelo Computador/Dispositivo tiene usuarioId y departamentoId
      const computadores = await prisma.computador.findMany({ 
        where: { modeloId, usuarioId: null, departamentoId: null } 
      });
      const dispositivos = await prisma.dispositivo.findMany({ 
        where: { modeloId, usuarioId: null, departamentoId: null } 
      });
      
      const activos = [
        ...computadores.map(c => ({ value: c.id, label: `Serial: ${c.serial}`, type: 'Computador' as const })),
        ...dispositivos.map(d => ({ value: d.id, label: `Serial: ${d.serial}`, type: 'Dispositivo' as const }))
      ];
      return NextResponse.json(activos);
    }

    // =================================================================================
    // Bloque 2: Filtrado específico para la selección guiada (por Proveedor)
    // =================================================================================
    if (proveedor) {
        // Para las líneas, necesitamos la lógica más compleja para saber si están disponibles.
        const todasLasLineas = await prisma.lineaTelefonica.findMany({ where: { proveedor }});
        const idsLineas = todasLasLineas.map(l => l.id);

        const ultimasAcciones = await prisma.asignaciones.findMany({
            where: { lineaTelefonicaId: { in: idsLineas } },
            orderBy: { date: "desc" },
            distinct: ["lineaTelefonicaId"],
        });

        const mapaAcciones = new Map(ultimasAcciones.map(a => [a.lineaTelefonicaId, a]));

        const lineasDisponibles = todasLasLineas
            .filter(linea => {
                const accion = mapaAcciones.get(linea.id);
                return !accion || accion.actionType === "Devolucion"; // Disponible si no hay acción o la última fue una devolución
            })
            .map(l => ({ value: l.id, label: `Número: ${l.numero}`, type: 'LineaTelefonica' as const}));

        return NextResponse.json(lineasDisponibles);
    }

    // =================================================================================
    // Bloque 3: Lógica principal de filtrado por estado (asignado / disponible)
    // =================================================================================
    if (estado === "asignado" || estado === "disponible") {
        // 3A. Obtener TODOS los activos de todas las tablas
        const computadores = await prisma.computador.findMany({ include: { modelo: { include: { marca: true } } } });
        const dispositivos = await prisma.dispositivo.findMany({ include: { modelo: { include: { marca: true } } } });
        const lineas = await prisma.lineaTelefonica.findMany();

        const todosLosActivos = [
          ...computadores.map(c => ({ ...c, itemType: "Computador" as const })),
          ...dispositivos.map(d => ({ ...d, itemType: "Dispositivo" as const })),
          ...lineas.map(l => ({ ...l, itemType: "LineaTelefonica" as const })),
        ];

        const idsActivos = todosLosActivos.map(a => a.id);

        // 3B. Obtener la ÚLTIMA acción para cada activo
        const ultimasAcciones = await prisma.asignaciones.findMany({
          where: {
            OR: [
              { computadorId: { in: idsActivos } },
              { dispositivoId: { in: idsActivos } },
              { lineaTelefonicaId: { in: idsActivos } }
            ]
          },
          orderBy: { date: "desc" },
          distinct: ["computadorId", "dispositivoId", "lineaTelefonicaId"],
          include: {
            targetUsuario: true,
            targetDepartamento: true
          }
        });

        // 3C. Crear un mapa para acceder rápidamente a la última acción de un activo
        const mapaAcciones = new Map(
          ultimasAcciones.map(a => [a.computadorId || a.dispositivoId || a.lineaTelefonicaId, a])
        );

        // 3D. Filtrar y dar formato a la lista final según el estado solicitado
        let activosFiltrados = [];

        if (estado === "asignado") {
          activosFiltrados = todosLosActivos
            .filter(activo => {
              const accion = mapaAcciones.get(activo.id);
              return accion?.actionType === "Asignacion";
            })
            .map(activo => {
              const accion = mapaAcciones.get(activo.id)!;
              const asignadoA = accion.targetType === "Usuario"
                  ? `${accion.targetUsuario?.nombre} ${accion.targetUsuario?.apellido}`
                  : accion.targetDepartamento?.nombre;
              
              const label = activo.itemType === 'LineaTelefonica'
                ? `Línea ${activo.proveedor} (${activo.numero})`
                : `${activo.modelo.marca.nombre} ${activo.modelo.nombre} (Serial: ${activo.serial})`;

              return {
                value: activo.id,
                label: label,
                type: activo.itemType,
                asignadoA: asignadoA ?? "Destino desconocido",
              };
            });
        } else { // estado === "disponible"
          activosFiltrados = todosLosActivos
            .filter(activo => {
              const accion = mapaAcciones.get(activo.id);
              return !accion || accion.actionType === "Devolucion";
            })
            .map(activo => {
                const label = activo.itemType === 'LineaTelefonica'
                    ? `Línea ${activo.proveedor}: ${activo.numero}`
                    : `${activo.modelo.marca.nombre} ${activo.modelo.nombre} (Serial: ${activo.serial})`;

                return {
                    value: activo.id,
                    label: label,
                    type: activo.itemType,
                };
            });
        }

        return NextResponse.json(activosFiltrados);
    }

    // Si no se proporciona ningún filtro válido, devolver un error.
    return NextResponse.json(
        { error: "Se requiere un parámetro de filtro válido ('estado', 'modeloId', o 'proveedor')." },
        { status: 400 }
    );

  } catch (error) {
    console.error(`Error fetching activos:`, error);
    return NextResponse.json(
      { error: "Failed to fetch activos" },
      { status: 500 }
    );
  }
}