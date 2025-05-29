import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { writeFile, mkdir, stat, unlink } from 'fs/promises'; // Añadimos unlink
import path from 'path';

interface Params {
    params: {
        id: string;
    };
}

// --- Helper para asegurar que el directorio existe (lo necesitarás si subes nuevas imágenes en PUT) ---
async function ensureDirExists(dirPath: string) {
    try {
        await stat(dirPath);
    } catch (e: any) {
        if (e.code === 'ENOENT') {
            await mkdir(dirPath, { recursive: true });
        } else {
            throw e;
        }
    }
}

// --- Helper para eliminar un archivo (si existe) ---
async function deletePreviousImage(imagePath: string | null | undefined) {
    if (imagePath) {
        // imagePath viene como /uploads/equipos/imagen.jpg, necesitamos la ruta completa del sistema
        const fullPath = path.join(process.cwd(), 'public', imagePath);
        try {
            await stat(fullPath); // Verifica si existe
            await unlink(fullPath); // Elimina el archivo
            console.log(`Imagen anterior eliminada: ${fullPath}`);
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                console.log(`Imagen anterior no encontrada, no se eliminó nada: ${fullPath}`);
            } else {
                console.error(`Error al eliminar imagen anterior ${fullPath}:`, e);
                // Podrías decidir si este error debe detener la operación o solo registrarse
            }
        }
    }
}


// --- GET (Obtener un equipo por ID) ---
export async function GET(request: Request, { params }: Params) {
    const { id } = params;
    try {
        const equipo = await prisma.dispositivo.findUnique({
            where: { id },
        });
        if (!equipo) {
            return NextResponse.json({ message: 'Equipo no encontrado' }, { status: 404 });
        }
        return NextResponse.json(equipo, { status: 200 });
    } catch (error) {
        console.error(`Error en GET /api/equipos/${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}

// --- PUT (Actualizar un equipo por ID) ---
export async function PUT(request: Request, { params }: Params) {
    const { id } = params;
    try {
        const formData = await request.formData();
        const equipoExistente = await prisma.dispositivo.findUnique({ where: { id } });

        if (!equipoExistente) {
            return NextResponse.json({ message: 'Equipo no encontrado para actualizar' }, { status: 404 });
        }

        const dataToUpdate: { [key: string]: any } = {};
        let newImageUrl: string | undefined = equipoExistente.img || undefined; // Mantener la imagen actual por defecto
        let oldImageToDelete: string | null = null;

        // Iterar sobre los datos del formulario
        for (const [key, value] of formData.entries()) {
            if (key === 'imagenEquipo') {
                const imagenFile = value as File | null;
                if (imagenFile && imagenFile.size > 0) {
                    // Hay una nueva imagen para subir
                    oldImageToDelete = equipoExistente.img; // Marcar la imagen anterior para eliminar

                    const uploadDir = path.join(process.cwd(), 'public/uploads/equipos');
                    await ensureDirExists(uploadDir);

                    const bytes = await imagenFile.arrayBuffer();
                    const buffer = Buffer.from(bytes);
                    const safeOriginalName = imagenFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const filename = `${Date.now()}-${safeOriginalName}`;
                    const imagePath = path.join(uploadDir, filename);

                    await writeFile(imagePath, buffer);
                    newImageUrl = `/uploads/equipos/${filename}`;
                } else if (formData.has(key) && imagenFile && imagenFile.size === 0 && equipoExistente.img) {
                    // Si se envía 'imagenEquipo' pero está vacío, podría interpretarse como "eliminar imagen actual"
                }
            } else if (typeof value === 'string') {
                // Aquí también, convierte a números, booleanos, etc., si es necesario
                // Ejemplo: if (key === 'cantidad') dataToUpdate[key] = parseInt(value, 10);
                dataToUpdate[key] = value;
            }
        }
        
        dataToUpdate.imageUrl = newImageUrl; // Asignar la nueva URL o la antigua si no cambió

        // Si la imagen cambió y había una anterior, eliminar la antigua DESPUÉS de subir la nueva
        if (newImageUrl !== equipoExistente.img && oldImageToDelete) {
             await deletePreviousImage(oldImageToDelete);
        }

        const updatedEquipo = await prisma.dispositivo.update({
            where: { id },
            data: dataToUpdate as any, // Cuidado con 'as any', valida y tipa los datos.
        });

        return NextResponse.json(updatedEquipo, { status: 200 });

    } catch (error) {
        console.error(`Error en PUT /api/equipos/${id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al actualizar el equipo';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}


// --- DELETE (Eliminar un equipo por ID) ---
export async function DELETE(request: Request, { params }: Params) {
    const { id } = params;
    try {
        // 1. Obtener el equipo para saber la ruta de su imagen (si tiene)
        const equipoExistente = await prisma.dispositivo.findUnique({
            where: { id },
        });

        if (!equipoExistente) {
            return NextResponse.json({ message: 'Equipo no encontrado para eliminar' }, { status: 404 });
        }

        // 2. Eliminar la imagen del sistema de archivos (si existe)
        if (equipoExistente.img) {
            await deletePreviousImage(equipoExistente.img);
        }

        // 3. Eliminar el registro de la base de datos
        const deletedEquipo = await prisma.dispositivo.delete({
            where: { id },
        });

        return NextResponse.json(deletedEquipo, { status: 200 }); // O un mensaje de éxito

    } catch (error) {
        console.error(`Error en DELETE /api/dispositivos/${id}:`, error);
        // Manejar errores específicos de Prisma, como P2025 (Registro no encontrado) si es necesario
        // if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        // return NextResponse.json({ message: 'Error: El equipo ya no existe.' }, { status: 404 });
        // }
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al eliminar el equipo';
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}