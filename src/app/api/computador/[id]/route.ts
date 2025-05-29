import { NextResponse } from 'next/server';
import { prisma } from '../../../../../utils/database';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const equipo = await prisma.computador.findUnique({
      where: {
        id: id,
      },
    });
    if (!equipo) {
      return NextResponse.json({ message: 'Equipo no encontrado' }, { status: 404 });
    }
    return NextResponse.json(equipo, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedEquipo = await prisma.computador.update({
      where: {
        id: id,
      },
      data: body,
    });
    return NextResponse.json(updatedEquipo, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.computador.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'Equipo eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar equipo' }, { status: 500 });
  }
}
