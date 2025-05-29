import { NextResponse } from 'next/server';
import { prisma } from '../../../../utils/database';

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany();
    return NextResponse.json(usuarios, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newUsuario = await prisma.usuario.create({
      data: body,
    });
    return NextResponse.json(newUsuario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear Usuario' }, { status: 500 });
  }
}
