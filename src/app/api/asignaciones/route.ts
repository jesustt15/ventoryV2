// src/app/api/asignaciones/route.ts (VERSIÓN CORREGIDA)

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const asignacionSchema = z.object({
  equipoId: z.string().uuid(),
  equipoType: z.enum(['Computador', 'Dispositivo']),
  action: z.enum(['asignar', 'desvincular']),
  asignarA_type: z.enum(['Usuario', 'Departamento']).optional(), // Nombres en mayúscula para coincidir con el modelo
  asignarA_id: z.string().uuid().optional(),
  notas: z.string().optional(),
});


export async function GET(request: Request) {
  try {
    const asignaciones = await prisma.asignaciones.findMany({
      orderBy: { createdAt: 'desc' },});
    return NextResponse.json(asignaciones, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener asignaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = asignacionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Datos inválidos', errors: validation.error.errors }, { status: 400 });
    }

    const { equipoId, equipoType, action, asignarA_type, asignarA_id, notas } = validation.data;

    const result = await prisma.$transaction(async (tx) => {
      let dataToUpdate: any = {};

      if (action === 'asignar') {
        if (!asignarA_type || !asignarA_id) {
          throw new Error("Para asignar, se requiere el tipo y el ID del objetivo.");
        }

        // Lógica para actualizar el equipo (sin cambios)
        if (asignarA_type === 'Usuario') {
          dataToUpdate = { usuarioId: asignarA_id, departamentoId: null, estado: 'Asignado' };
        } else { // 'Departamento'
          dataToUpdate = { departamentoId: asignarA_id, usuarioId: null, estado: 'Asignado' };
        }
        
        // Actualizar el equipo (Computador o Dispositivo)
        await (tx as any)[equipoType].update({
          where: { id: equipoId },
          data: dataToUpdate,
        });

        // Crear el registro de historial con la ESTRUCTURA CORREGIDA
        await tx.asignaciones.create({
          data: {
            equipoId,
            equipoType,
            type: 'Assignment',
            targetId: asignarA_id,     // <-- Usando el nuevo campo
            targetType: asignarA_type, // <-- Usando el nuevo campo
            notes: notas,
          },
        });

      } else { // 'desvincular'
        
        // Se busca el equipo para saber quién lo tenía antes de desvincularlo
        const equipoActual = await (tx as any)[equipoType].findUnique({
            where: { id: equipoId },
            select: { usuarioId: true, departamentoId: true }
        });

        if (!equipoActual) throw new Error("El equipo no existe.");

        // Lógica para actualizar el equipo (sin cambios)
        dataToUpdate = { usuarioId: null, departamentoId: null, estado: 'Resguardo' };
        await (tx as any)[equipoType].update({
          where: { id: equipoId },
          data: dataToUpdate,
        });

        // Crear el registro de historial para la devolución
        await tx.asignaciones.create({
            data: {
                equipoId,
                equipoType,
                type: 'Return',
                // Aquí decidimos qué registrar en la devolución
                targetId: equipoActual.usuarioId || equipoActual.departamentoId || 'N/A',
                targetType: equipoActual.usuarioId ? 'Usuario' : 'Departamento',
                notes: notas,
            },
        });
      }

      return { success: true };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error en la asignación:", error);
    return NextResponse.json({ message: error.message || 'Error en el servidor' }, { status: 500 });
  }
}