// src/app/api/asignaciones/route.ts (VERSIÓN CORREGIDA)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getRenderResumeDataCache } from 'next/dist/server/app-render/work-unit-async-storage.external';

const asignacionSchema = z.object({
  action: z.enum(['asignar', 'desvincular']),
  itemId: z.string().uuid(),
  itemType: z.enum(['Computador', 'Dispositivo', 'LineaTelefonica']),
  asignarA_id: z.string().uuid().optional(),
  asignarA_type: z.enum(['Usuario', 'Departamento']).optional(),
  notas: z.string().optional(),
  gerente: z.string().optional(),
  serialC: z.string().optional(),
  modeloC: z.string().optional(),
  motivo: z.string().optional(),
  localidad: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const asignaciones = await prisma.asignaciones.findMany({
      orderBy: { date: 'desc' },
      include: {
        computador: {
          include: {
            modelo: {
              include: {
                marca: true, // Incluye el objeto Marca si existe
              }
            }
          }
        },         // Incluye el objeto Computador si existe
        dispositivo:{
          include: {
            modelo: {
              include: {
                marca: true, // Incluye el objeto Marca si existe
              }
            }
          }
        },
        lineaTelefonica: true,        // Incluye el objeto Dispositivo si existe
        targetUsuario: true,      // Incluye el objeto Usuario si existe
        targetDepartamento: true, // Incluye el objeto Departamento si existe
      },
    });

    const resultadoFinal = asignaciones.map((a) => {
      let itemAsignado;
      if (a.itemType === 'Computador' && a.computador) {
        itemAsignado = {
          id: a.computador.id,
          tipo: 'Computador',
          serial: a.computador.serial,
          descripcion: `${a.computador.modelo.marca.nombre} ${a.computador.modelo.nombre}`,
        };
      } else if (a.itemType === 'Dispositivo' && a.dispositivo) {
        itemAsignado = {
          id: a.dispositivo.id,
          tipo: 'Dispositivo',
          serial: a.dispositivo.serial,
          descripcion: `${a.dispositivo.modelo.marca.nombre} ${a.dispositivo.modelo.nombre}`,
          detalles: {
            tipoDispositivo: a.dispositivo.modelo.tipo,
          },
        };
      } else if (a.itemType === 'LineaTelefonica' && a.lineaTelefonica) {
        itemAsignado = {
          id: a.lineaTelefonica.id,
          tipo: 'LineaTelefonica',
          serial: a.lineaTelefonica.imei,
          descripcion: `${a.lineaTelefonica.proveedor} - ${a.lineaTelefonica.numero}`,
        };
      }

      let asignadoA;
      if (a.targetType === 'Usuario' && a.targetUsuario) {
        asignadoA = {
          id: a.targetUsuario.id,
          tipo: 'Usuario',
          nombre: `${a.targetUsuario.nombre} ${a.targetUsuario.apellido}`,
        };
      } else if (a.targetType === 'Departamento' && a.targetDepartamento) {
        asignadoA = {
          id: a.targetDepartamento.id,
          tipo: 'Departamento',
          nombre: a.targetDepartamento.nombre,
        };
      }

      return {
        id: a.id,
        date: a.date,
        notes: a.notes,
        item: itemAsignado,
        asignadoA: asignadoA,
        gerente: a.gerente,
        serialC: a.serialC,
        modeloC: a.modeloC,
        motivo: a.motivo,
        localidad: a.localidad,
      };
    });

    return NextResponse.json(resultadoFinal, { status: 200 });

  } catch (error) {
    console.error("Error al obtener asignaciones:", error);
    return NextResponse.json({ error: "No se pudieron obtener las asignaciones." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[API/ASIGNACIONES] Body recibido:", body);
    const validation = asignacionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Datos inválidos', errors: validation.error.errors }, { status: 400 });
    }

    const { action, itemId, itemType, asignarA_id, asignarA_type, notas,
      gerente, serialC, modeloC, motivo, localidad
     } = validation.data;

     const prismaModelMapping = {
      Computador: 'computador',
      Dispositivo: 'dispositivo',
      LineaTelefonica: 'lineaTelefonica'
    };
    
    const prismaModelName = prismaModelMapping[itemType];

    if (!prismaModelName) {
        throw new Error(`Tipo de item inválido proporcionado: ${itemType}`);
    }
    console.log(`[API/ASIGNACIONES] Acción: ${action} sobre ${prismaModelName} con ID: ${itemId}`);
    const result = await prisma.$transaction(async (tx) => {
      if (action === 'asignar') {
        if (!asignarA_id || !asignarA_type) {
          throw new Error("Para asignar, se requiere el tipo y el ID del objetivo.");
        }

        // Crear el registro de historial con las relaciones correctas
        await tx.asignaciones.create({
          data: {
            actionType: 'Asignacion', // <- Nuevo campo
            itemType: itemType,
            computadorId: itemType === 'Computador' ? itemId : null,
            dispositivoId: itemType === 'Dispositivo' ? itemId : null,
            lineaTelefonicaId: itemType === 'LineaTelefonica' ? itemId : null,
            targetType: asignarA_type,
            targetUsuarioId: asignarA_type === 'Usuario' ? asignarA_id : null,
            targetDepartamentoId: asignarA_type === 'Departamento' ? asignarA_id : null,
            notes: notas,
            gerente: gerente || null,
            serialC: itemType === 'Computador' ? serialC : null,
            modeloC: itemType === 'Computador' ? modeloC : null,
            motivo: motivo || null,
            localidad // Guardamos el motivo de la asignación
          },
        });
            // -- OPERACIÓN 2: Actualizar el estado del activo correspondiente --
      const updateData = {
      estado: 'Asignado',
      usuarioId: asignarA_type === 'Usuario' ? asignarA_id : null,
      departamentoId: asignarA_type === 'Departamento' ? asignarA_id : null,
    };
      switch (itemType) {
      case 'Computador':
        await tx.computador.update({
          where: { id: itemId },
          data: updateData, // ¡Actualiza usuarioId/departamentoId!
        });
        break;
      case 'Dispositivo':
        await tx.dispositivo.update({
          where: { id: itemId },
          data: updateData, // ¡Actualiza usuarioId/departamentoId!
        });
        break;
      case 'LineaTelefonica':
        // No requiere actualización directa
        break;
    }

      } else { // 'desvincular'
        
        // 1. Encontrar la última asignación activa para este item
        const ultimaAsignacion = await tx.asignaciones.findFirst({
            where: {
                OR: [{ computadorId: itemId }, { dispositivoId: itemId }],
                actionType: 'Asignacion' // Solo nos interesan las asignaciones activas
            },
            orderBy: { date: 'desc' },
        });

        if (!ultimaAsignacion) {
            throw new Error("No se encontró una asignación activa para este ítem para desvincular.");
        }

        // 2. Marcar esa asignación como devuelta (o crear un nuevo registro de devolución)
        // Optamos por crear un nuevo registro para un historial inmutable y más claro.
        await tx.asignaciones.create({
          data: {
            actionType: 'Devolucion', // <- Nuevo campo
            itemType: itemType,
            computadorId: itemType === 'Computador' ? itemId : null,
            dispositivoId: itemType === 'Dispositivo' ? itemId : null,
            lineaTelefonicaId: itemType === 'LineaTelefonica' ? itemId : null,
            // Guardamos quién lo devolvió para el historial
            targetType: ultimaAsignacion.targetType,
            targetUsuarioId: ultimaAsignacion.targetUsuarioId,
            targetDepartamentoId: ultimaAsignacion.targetDepartamentoId,
            notes: notas || `Devolución de ${ultimaAsignacion.targetType}`,
          },
        });
      }
      return { success: true, message: `Acción '${action}' completada.` };
    });

    return NextResponse.json(result, { status: 200 });

  } catch (error: any) {
    console.error("Error en la transacción de asignación:", error);
    return NextResponse.json({ message: error.message || 'Error en el servidor' }, { status: 500 });
  }
}