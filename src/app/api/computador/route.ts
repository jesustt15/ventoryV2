import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {

  const { searchParams } = new URL(request.url);
  const asignado = searchParams.get('asignado'); // 'true' o 'false'
  let where: Prisma.ComputadorWhereInput = {};

  if (asignado === 'false') {
    // Si queremos los NO asignados, ambos campos de ID deben ser null
    where = { usuarioId: null, departamentoId: null };
  } else if (asignado === 'true') {
    // Si queremos los SÍ asignados, al menos uno de los campos de ID NO debe ser null
    where = {
      OR: [
        { usuarioId: { not: null } },
        { departamentoId: { not: null } },
      ],
    };
  }

  try {
    const computadores = await prisma.computador.findMany({
      where, // Aplicamos el filtro
      include: {
        modelo: {
          include: {
            marca: true,
          },
        },
        usuario: true, // Incluimos esto para saber a quién está asignado
        departamento: true, // Y a qué depto
      },
      orderBy: {
        modelo: {
          nombre: 'asc'
        }
      }
    });
    return NextResponse.json(computadores);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener computadores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validar que el serial venga en el body
    if (!body.serial) {
      return NextResponse.json({ message: 'El serial es obligatorio' }, { status: 400 });
    }

    // 2. Verificar si ya existe un equipo con ese serial
    const serialExistente = await prisma.computador.findUnique({
      where: { serial: body.serial },
    });

    if (serialExistente) {
      return NextResponse.json(
        { message: `Ya existe un equipo registrado con el serial: ${body.serial}` },
        { status: 400 } // Error de cliente: datos inválidos
      );
    }

    // 3. Si no existe, procedemos a crear
    const newEquipo = await prisma.computador.create({
      data: body,
    });

    return NextResponse.json(newEquipo, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear equipo:", error);
    
    // Capturar error de Prisma por si falla la restricción de unicidad a nivel DB (P2002)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { message: 'El serial ya está en uso.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
