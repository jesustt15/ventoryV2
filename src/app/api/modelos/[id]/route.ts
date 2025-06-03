import { NextResponse } from "next/server";
import { writeFile, mkdir, stat, unlink } from 'fs/promises'; // Añadimos unlink
import path from 'path';


import prisma  from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const {id} = await params;

  try {
    const modelo = await prisma.modeloDispositivo.findUnique({
      where: {
        id: id,
      },
    });

    if (!modelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    return NextResponse.json(modelo);
  } catch (error) {
    console.error("Error fetching modelo:", error);
    return NextResponse.json(
      { message: "Error fetching modelo" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const {id} = await params;

  try {
    // Fetch the existing modelo
    const existingModelo = await prisma.modeloDispositivo.findUnique({
      where: {
        id: id,
      },
    });

    if (!existingModelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    const data = await request.formData();
    const nombre = data.get('nombre') as string;
    const marcaId = data.get('marcaId') as string;
    const tipo = data.get('tipo') as string;
    const image = data.get('img') as File | null;

    if (!nombre|| typeof nombre !== 'string') {
      return NextResponse.json({ message: "El campo 'nombre' es obligatorio" }, { status: 400 });
    }

    let imageUrl = existingModelo.img; // Keep the existing image URL by default

    if (image) {
  // Si hay una imagen nueva, borramos la antigua
      if (existingModelo.img) {
    // 1. Obtiene la ruta de la URL desde la BD (ej: /uploads/modelos/imagen.jpg)
    const urlPath = existingModelo.img;
    const filePathSegment = urlPath.startsWith('/') ? urlPath.substring(1) : urlPath;

    // 3. Construye la ruta de archivo absoluta y correcta
    const imagePath = path.join(process.cwd(), 'public', filePathSegment);
    
    try {
      // 4. Ahora sí, borra el archivo usando la ruta correcta
      await unlink(imagePath);
    } catch (unlinkError: any) {
      // Es posible que el archivo ya no exista, podemos registrar el error pero continuar
      if (unlinkError.code !== 'ENOENT') {
        console.error("Error deleting old image:", unlinkError);
        return NextResponse.json({ message: "Error deleting old image" }, { status: 500 });
      }
    }
  }
}

    const updatedModelo = await prisma.modeloDispositivo.update({
      where: {
        id: id,
      },
      data: {
        id,
        nombre,
        tipo,
        marcaId: marcaId,
        img: imageUrl,
      },
    });

    return NextResponse.json(updatedModelo);
  } catch (error) {
    console.error("Error updating modelo:", error);
    return NextResponse.json(
      { message: "Error updating modelo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const {id }= await params;

  try {
    // Fetch the modelo to get the image URL
    const modelo = await prisma.modeloDispositivo.findUnique({
      where: {
        id: id,
      },
    });

    if (!modelo) {
      return NextResponse.json({ message: "Modelo not found" }, { status: 404 });
    }

    // Delete the image file
    if (modelo.img) {
      const imagePath = path.join(process.cwd(), 'public', modelo.img);
      try {
        await unlink(imagePath);
      } catch (unlinkError) {
        console.error("Error deleting image:", unlinkError);
        return NextResponse.json({ message: "Error deleting image" }, { status: 500 });
      }
    }

    // Delete the modelo from the database
    await prisma.modeloDispositivo.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: "Modelo deleted successfully" });
  } catch (error) {
    console.error("Error deleting modelo:", error);
    return NextResponse.json(
      { message: "Error deleting modelo" },
      { status: 500 }
    );
  }
}
