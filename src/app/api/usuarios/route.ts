import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/api-auth';

export async function GET() {
  // Solo usuarios autenticados pueden ver usuarios
  const authError = await requireAuth();
  if (authError) return authError;
  
  try {
    const usuarios = await prisma.usuario.findMany({
      include: {
        departamento: {
          include: {
            gerencia: {}
          }
        }
      }
    });
    return NextResponse.json(usuarios, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener usuario' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Solo admin puede crear usuarios del inventario
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    const body = await request.json();
    const { legajo, ...rest } = body;
    const newUsuario = await prisma.usuario.create({
      data: {
        legajo: Number(legajo),
        ...rest,
      },
    });
    return NextResponse.json(newUsuario, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear Usuario' }, { status: 500 });
  }
}
