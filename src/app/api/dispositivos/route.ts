import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'
import path from 'path';
import { stat, mkdir, writeFile } from 'fs/promises';


export async function GET() {
  try {
    const equipos = await prisma.dispositivo.findMany({
      include: {
        modelo:{
          include: {
            marca: true, // Incluye la marca del modelo
          }
        },
      }
    });
    return NextResponse.json(equipos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Ya no es FormData, ahora es JSON simple
    const body = await request.json();
    const { modeloId, serial, nsap, estado } = body;

    // Validación
    if (!modeloId || !serial  || !estado) {
        return NextResponse.json({ message: 'Todos los campos son requeridos' }, { status: 400 });
    }

    const nuevoDispositivo = await prisma.dispositivo.create({
      data: {
        modeloId,
        serial,
        nsap,
        estado,
        // ... otros campos como usuarioId, departamentoId ...
      },
    });
    return NextResponse.json(nuevoDispositivo, { status: 201 });
  } catch (error) {
    console.error(error);
    // Manejo de errores (ej: serial o nsap duplicado - código P2002 de Prisma)
    return NextResponse.json({ message: 'Error al crear el dispositivo' }, { status: 500 });
  }
}
