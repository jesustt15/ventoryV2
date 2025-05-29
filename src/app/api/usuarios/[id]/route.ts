import { NextResponse } from 'next/server';
import { prisma } from '../../../../../utils/database';

interface Params {
  id: string;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const usuario = await prisma.usuario.findUnique({
      where: {
        id: id,
      },
    });
    if (!usuario) {
      return NextResponse.json({ message: 'usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json(usuario, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedUsuario = await prisma.usuario.update({
      where: {
        id: id,
      },
      data: body,
    });
    return NextResponse.json(updatedUsuario, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    await prisma.usuario.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ message: 'usuario eliminado' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar usuario' }, { status: 500 });
  }
}
