import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import path from 'path';


import { NextRequest, NextResponse } from 'next/server';



export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  
  // CORREGIDO: Accedemos al `id` directamente desde `params`.
  // No se usa `await` y se accede como una propiedad simple.
  const { id } = params;

  // Para depuración, puedes ver si el ID llega correctamente
  console.log("API: Recibido ID de asignación:", id)
     try {
    // 1. Obtener los datos de la asignación y sus relaciones
    const asignacion = await prisma.asignaciones.findUnique({
      where: { id: parseInt(id) },
      include: {
        computador: {
          include: {
            modelo: {
              include: {
                marca: true, // Incluir la marca del modelo
              },
            },
            usuario: true, // Si el computador está directamente asignado a un usuario
            departamento: true, // Si el computador está directamente asignado a un departamento
          },
        },
        dispositivo: {
          include: {
            modelo: {
              include: {
                marca: true,
              },
            },
            usuario: true,
            departamento: true,
            lineas: true, // Si tiene líneas telefónicas asociadas
          },
        },
        targetUsuario: {
          include: {
            departamento: {
              include: {
                gerencia: true, // Incluir la gerencia del departamento
              },
            },
          },
        },
        targetDepartamento: {
          include: {
            gerencia: true,
          },
        },
      },
      }) // Asegúrate de que el ID sea un entero si tu campo `id` es `Int`

    if (!asignacion) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }



    // 2. Cargar la plantilla de Excel
    const templatePath = path.resolve(process.cwd(), 'public', 'nota_entrega_template.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    const worksheet = workbook.getWorksheet(1); // Asume que la plantilla tiene una hoja principal

    // 3. Rellenar los campos de la plantilla
    // **ADAPTA ESTAS CELDAS A TU FORMATO DE EXCEL ESPECÍFICO**

    if (!worksheet) {
      return NextResponse.json({ message: 'Excel worksheet not found.' }, { status: 500 });
    }

    // Datos de la Asignación
    // worksheet.getCell('B2').value = asignacion.id; // ID de la Asignación
    worksheet.getCell('B4').value = asignacion.date.toLocaleDateString('es-ES'); // Fecha de Asignación

    // Datos del Usuario/Departamento Asignado (Target)
    if (asignacion.targetType === 'Usuario') {
      worksheet.getCell('B5').value = `${asignacion.targetUsuario?.nombre} ${asignacion.targetUsuario?.apellido}`;
      worksheet.getCell('B6').value = asignacion.targetUsuario?.ced || '';
      worksheet.getCell('B7').value = asignacion.targetUsuario?.cargo || '';
      worksheet.getCell('B8').value = asignacion.targetUsuario?.legajo;
      worksheet.getCell('B9').value = asignacion.targetUsuario?.departamento.sociedad;
      worksheet.getCell('B10').value = asignacion.targetUsuario?.departamento.nombre;
      worksheet.getCell('B11').value = asignacion.localidad;
      worksheet.getCell('B12').value = asignacion.gerente;
      worksheet.getCell('B13').value =asignacion.targetUsuario?.departamento.ceco;
      worksheet.getCell('B15').value = asignacion.motivo;
    } else { // targetType === 'Departamento'
      worksheet.getCell('B5').value = asignacion.targetDepartamento?.nombre;
      worksheet.getCell('B6').value = asignacion.targetDepartamento?.gerencia.nombre;
      worksheet.getCell('B7').value = asignacion.targetDepartamento?.ceco;
      worksheet.getCell('B8').value = asignacion.targetDepartamento?.sociedad;
      worksheet.getCell('B9').value = '';
      worksheet.getCell('B10').value = '';
    }


    if (asignacion.itemType === 'Computador') {
        worksheet.getCell('E4').value = `${asignacion.computador?.modelo.marca.nombre} ${asignacion.computador?.modelo.nombre}`; // Marca
        worksheet.getCell('E5').value = asignacion.computador?.serial;
        worksheet.getCell('B4').value = asignacion.computador?.modelo.tipo; // Tipo de equipo (Computador o Dispositivo)
        worksheet.getCell('B6').value = asignacion.computador?.nsap || ''; // NSAP (si aplica)
        worksheet.getCell('E6').value = asignacion.computador?.procesador || 'N/A';
        worksheet.getCell('E7').value = asignacion.computador?.ram || 'N/A';
        worksheet.getCell('E8').value = asignacion.computador?.almacenamiento || 'N/A';
        worksheet.getCell('E13').value = asignacion.computador?.sisOperativo || 'N/A';
        worksheet.getCell('E15').value = asignacion.computador?.sapVersion || 'N/A';
        worksheet.getCell('E14').value = asignacion.computador?.officeVersion || 'N/A';
    } else if (asignacion.itemType === 'Dispositivo') {
      // Si hay líneas telefónicas, puedes listarlas o poner la primera
      // Limpiar celdas de computador si el equipo es un dispositivo
      worksheet.getCell('E4').value = `${asignacion.dispositivo?.modelo.marca.nombre} ${asignacion.dispositivo?.modelo.nombre}`; // Marca
      worksheet.getCell('E5').value = asignacion.dispositivo?.serial;
      worksheet.getCell('E6').value = '';
      worksheet.getCell('E7').value = '';
      worksheet.getCell('E8').value = '';
 
    }

    // Notas de la asignación
    worksheet.getCell('B24').value = asignacion.notes || 'Sin notas.';


    // 4. Escribir el archivo Excel a un buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // 5. Enviar el archivo como respuesta
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Nota_Entrega_${asignacion.id}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Error generating delivery note:', error);
    return NextResponse.json({message:'Error generating delivery note.'}, {status: 500});
  } finally {
    await prisma.$disconnect();
  }

}