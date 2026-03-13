import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/api-auth';

export async function POST(request: Request) {
  // Solo admin puede crear marcas
  const authError = await requireAdmin();
  if (authError) return authError;
  
  try {
    const nombre = await request.json();
    console.log(nombre);
    if (!nombre) {
      return NextResponse.json({ message: 'El nombre de la marca es requerido.' }, { status: 400 });
    }

    const newMarca = await prisma.marca.create({
      data: nombre,
    });

    return NextResponse.json(newMarca, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/marcas:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear la marca';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  // Solo usuarios autenticados pueden ver marcas
  const authError = await requireAuth();
  if (authError) return authError;
  
  try {
    const marcas = await prisma.marca.findMany({
      orderBy:{
        nombre: 'asc',
      }
    });
    return NextResponse.json(marcas, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener marcas' }, { status: 500 });
  }
}
