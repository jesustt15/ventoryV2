import { NextResponse } from 'next/server';
import { prisma } from '../../../../../utils/database';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: {
        id: id,
      },
    });
    if (!user) {
      return NextResponse.json({ message: 'user no encontrado' }, { status: 404 });
    }
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipo' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedUser = await prisma.user.update({
      where: {
        id: id,
      },
      data: body,
    });
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.user.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'user eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar user' }, { status: 500 });
  }
}
