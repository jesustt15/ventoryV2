import { NextRequest, NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/api-auth';

interface Params {
  id: string;
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const gerencia = await prisma.gerencia.findUnique({
      where: {
        id: id,
      },
      include: {
        gerente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cargo: true,
          },
        },
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

export async function PUT(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
    const body = await request.json();
    const nombre = String(body?.nombre ?? '').trim();
    const gerenteId = body?.gerenteId ? String(body.gerenteId) : null;

    if (!nombre) {
      return NextResponse.json({ message: 'El nombre es requerido' }, { status: 400 });
    }

    const updatedGerencia = await prisma.gerencia.update({
      where: {
        id: id,
      },
      data: {
        nombre,
        gerenteId,
      },
      include: {
        gerente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            cargo: true,
          },
        },
      },
    });
    return NextResponse.json(updatedGerencia, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al actualizar equipo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await Promise.resolve();
    const id = request.nextUrl.pathname.split('/')[3];
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
