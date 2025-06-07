import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const gerencia = await prisma.gerencia.findUnique({
      where: {
        id: id,
      },
    });
    if (!gerencia) {
      return NextResponse.json({ message: 'Gerencia no encontrada' }, { status: 404 });
    }
    return NextResponse.json(gerencia, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedGerencia = await prisma.gerencia.update({
      where: {
        id: id,
      },
      data: body,
    });
    return NextResponse.json(updatedGerencia, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.gerencia.delete({
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
