import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'
import path from 'path';
import { stat, mkdir, writeFile } from 'fs/promises';


export async function GET() {
  try {
    const equipos = await prisma.dispositivo.findMany();
    return NextResponse.json(equipos, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al obtener equipos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extract brand and model from form data
    const marcaNombre = formData.get('marca') as string;
    const modeloNombre = formData.get('modelo') as string;

    // Validate required fields
    if (!marcaNombre || !modeloNombre) {
      return NextResponse.json({ message: 'Marca y Modelo son requeridos.' }, { status: 400 });
    }

    // Find or create Marca
    let marca = await prisma.marca.findUnique({
      where: { nombre: marcaNombre },
    });

    if (!marca) {
      marca = await prisma.marca.create({
        data: { nombre: marcaNombre },
      });
    }

    // Find or create ModeloDispositivo
    let modelo = await prisma.modeloDispositivo.findFirst({
      where: {
        nombre: modeloNombre,
        marcaId: marca.id,
      },
    });

    if (!modelo) {
      modelo = await prisma.modeloDispositivo.create({
        data: {
          nombre: modeloNombre,
          marcaId: marca.id,
          tipo: 'Unknown', // You might want to get this from the form as well
        },
      });
    }

    // Extract the remaining fields for the Dispositivo
    const dispositivoData: { [key: string]: any } = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'imagenEquipo' && key !== 'marca' && key !== 'modelo' && typeof value === 'string') {
        dispositivoData[key] = value;
      }
    }

    if (!dispositivoData.serial) {
      return NextResponse.json({ message: 'El campo "serial" es requerido.' }, { status: 400 });
    }

    // Set the modeloId to the dispositivoData
    dispositivoData.modeloId = modelo.id;
    
    // Validation básica de campos requeridos (ejemplo)
    if (!dispositivoData.nombre) {
        return NextResponse.json({ message: 'El campo "nombre" es requerido.' }, { status: 400 });
    }
    // Añade más validaciones para otros campos obligatorios de tu modelo Prisma


    // 2. Manejar la subida de la imagen
    const imagenFile = formData.get('imagenEquipo') as File | null;
    let imageUrl: string | undefined = undefined;
    const uploadDir = path.join(process.cwd(), 'public/uploads/equipos');

    if (imagenFile && imagenFile.size > 0) {
      // Asegurar que el directorio de subida exista
      try {
        await stat(uploadDir); // Comprueba si el directorio existe
      } catch (e: any) {
        if (e.code === 'ENOENT') { // Si no existe (Error NO ENTry)
          console.log(`Creando directorio: ${uploadDir}`);
          await mkdir(uploadDir, { recursive: true }); // Créealo recursivamente
        } else {
          console.error("Error al comprobar el directorio:", e);
          throw e; // Relanzar otros errores
        }
      }

      // Preparar para guardar el archivo
      const bytes = await imagenFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Crear un nombre de archivo único (ej: timestamp + nombre original)
      // Sanitizar el nombre del archivo para evitar problemas de ruta
      const safeOriginalName = imagenFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}-${safeOriginalName}`;
      const imagePath = path.join(uploadDir, filename);

      await writeFile(imagePath, buffer);
      imageUrl = `/uploads/equipos/${filename}`; // Ruta pública relativa
      dispositivoData.imageUrl = imageUrl; // Añadir la ruta de la imagen a los datos del equipo
    } else if (imagenFile && imagenFile.size === 0) {
      console.log("Se recibió un archivo de imagen vacío, se omitirá.");
    }


    // 3. Crear el registro del equipo en la base de datos
    // Asegúrate de que equipoData contenga todos los campos requeridos por tu modelo Prisma
    // y que los tipos de datos sean correctos (ej. convertir strings a números si es necesario)
    // Ejemplo: if (equipoData.cantidad) equipoData.cantidad = parseInt(equipoData.cantidad as string, 10);
    
    const newEquipo = await prisma.dispositivo.create({
      data: dispositivoData as any, // Usa 'as any' con precaución o mapea a un tipo fuerte
                               // basado en tu modelo Prisma para evitar errores de tipo.
                               // Lo ideal es validar y transformar 'equipoData'
                               // para que coincida exactamente con el tipo esperado por Prisma.
    });

    return NextResponse.json(newEquipo, { status: 201 });

  } catch (error) {
    console.error("Error en POST /api/equipos:", error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear el equipo';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
