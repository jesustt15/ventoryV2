import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/api-auth';

export async function GET() {
  // Solo usuarios autenticados pueden ver gerencias
  const authError = await requireAuth();
  if (authError) return authError;
  
  try {
    const gerencias = await prisma.gerencia.findMany();
    return NextResponse.json(gerencias, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener gerencias' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Solo admin puede crear gerencias
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    const body = await request.json();
    const newGerencia = await prisma.gerencia.create({
      data: body,
    });
    return NextResponse.json(newGerencia, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear gerencias' }, { status: 500 });
  }
}
