import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/database';

export async function GET() {
  try {
    const lineas = await prisma.lineaTelefonica.findMany();
    return NextResponse.json(lineas, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener lineas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newLinea = await prisma.lineaTelefonica.create({
      data: body,
    });
    return NextResponse.json(newLinea, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear equipo' }, { status: 500 });
  }
}
