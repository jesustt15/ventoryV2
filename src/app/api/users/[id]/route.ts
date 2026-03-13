import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  // Verificar que sea admin
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
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

export async function PUT(request: NextRequest) {
  // Verificar que sea admin
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
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

export async function DELETE(request: NextRequest) {
  // Verificar que sea admin
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
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
