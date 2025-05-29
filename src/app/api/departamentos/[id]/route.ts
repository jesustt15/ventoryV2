import { NextResponse } from 'next/server';
import { prisma } from '../../../../../utils/database';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const departamento = await prisma.departamento.findUnique({
      where: {
        id: id,
      },
    });
    if (!departamento) {
      return NextResponse.json({ message: 'Departamento no encontrado' }, { status: 404 });
    }
    return NextResponse.json(departamento, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener departamento' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedDepartamento = await prisma.departamento.update({
      where: {
        id: id,
      },
      data: body,
    });
    return NextResponse.json(updatedDepartamento, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar departamento' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.departamento.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'Departamento eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar departamento' }, { status: 500 });
  }
}
