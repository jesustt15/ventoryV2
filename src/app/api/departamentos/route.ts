import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET() {
  try {
    const departamentos = await prisma.departamento.findMany({
      include: {
        gerencia: true,
      }
    });
    return NextResponse.json(departamentos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener departamentos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Primero, leemos el cuerpo como texto para imprimirlo si es necesario
    const text = await request.text();
    console.log("Texto recibido:", text);

    // Luego, intentamos parsearlo como JSON
    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError);
      return NextResponse.json(
        { message: "JSON inválido" },
        { status: 400 }
      );
    }

    console.log("Cuerpo parseado:", body);

    // Comprobamos si body tiene la propiedad requerida
    if (!body.nombre) {
      console.error("La propiedad 'nombre' no se encontró en el cuerpo:", body);
      return NextResponse.json(
        { message: "La propiedad 'nombre' es requerida." },
        { status: 400 }
      );
    }

    // Creación del departamento
    const newDepartamento = await prisma.departamento.create({
      data: body,
    });
    return NextResponse.json(newDepartamento, { status: 201 });
  } catch (error) {
    console.error("Error al crear departamento:", error);
    return NextResponse.json(
      { message: 'Error al crear departamento' },
      { status: 500 }
    );
  }
}
