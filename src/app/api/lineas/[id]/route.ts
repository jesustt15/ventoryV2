import { NextResponse } from 'next/server';
import { prisma } from '../../../../../utils/database';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const linea = await prisma.lineaTelefonica.findUnique({
      where: {
        id: id,
      },
    });
    if (!linea) {
      return NextResponse.json({ message: 'Linea no encontrado' }, { status: 404 });
    }
    return NextResponse.json(linea, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener Linea' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedLinea = await prisma.lineaTelefonica.update({
      where: {
        id: id,
      },
      data: body,
    });
    return NextResponse.json(updatedLinea, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar linea' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.lineaTelefonica.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'linea eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar linea' }, { status: 500 });
  }
}
