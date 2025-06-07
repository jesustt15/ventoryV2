import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET() {
  try {
    const equipos = await prisma.computador.findMany({
      include:{
        modelo: {
          include: {
            marca: true, // Incluye la marca del modelo
          }
        },
        usuario: true, // Incluye el usuario asignado al equipo
        departamento: true, // Incluye el departamento al que pertenece el equipo
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
    const body = await request.json();
    const newEquipo = await prisma.computador.create({
      data: body,
    });
    return NextResponse.json(newEquipo, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear equipo' }, { status: 500 });
  }
}
