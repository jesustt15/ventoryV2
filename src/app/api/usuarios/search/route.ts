import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    const searchTerm = query.trim().toLowerCase();

    // Buscar usuarios por nombre o apellido
    const usuarios = await prisma.usuario.findMany({
      where: {
        OR: [
          {
            nombre: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            apellido: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        departamento: {
          select: {
            nombre: true,
          },
        },
      },
      take: 10, // Limitar a 10 resultados
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' },
      ],
    });

    // Formatear la respuesta
    const formattedResults = usuarios.map((usuario) => ({
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
      departamento: usuario.departamento.nombre,
      cargo: usuario.cargo,
    }));

    return NextResponse.json(formattedResults);
  } catch (error: any) {
    console.error('Error en búsqueda de usuarios:', error);
    return NextResponse.json(
      { error: 'Error al buscar usuarios', detail: error?.message },
      { status: 500 }
    );
  }
}
