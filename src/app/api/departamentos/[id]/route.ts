import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/api-auth';


export async function GET(request: NextRequest) {
  // Solo usuarios autenticados pueden ver departamentos
  const authError = await requireAuth();
  if (authError) return authError;
  
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
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

export async function PUT(request: NextRequest) {
  // Solo admin puede modificar departamentos
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
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

export async function DELETE(request: NextRequest) {
  // Solo admin puede eliminar departamentos
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
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
