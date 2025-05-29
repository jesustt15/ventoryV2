import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/database';

export async function GET() {
  try {
    const departamentos = await prisma.departamento.findMany();
    return NextResponse.json(departamentos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener departamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newDepartamento = await prisma.departamento.create({
      data: body,
    });
    return NextResponse.json(newDepartamento, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear departamento' }, { status: 500 });
  }
}
