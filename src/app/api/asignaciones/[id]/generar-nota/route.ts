import prisma from '@/lib/prisma';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

import { NextRequest, NextResponse } from 'next/server';

interface Params {
  id: string;
}

export async function GET({ params }: { params: Params }, res: NextResponse){

    const { id } = await params;

     try {
    // 1. Obtener los datos de la asignación y sus relaciones
    const asignacion = await prisma.asignaciones.findUnique({
      where: { id: parseInt(id) }, // Asegúrate de que el ID sea un entero si tu campo `id` es `Int`
    });

    if (!asignacion) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    let equipoData;
    let targetData;

    // Obtener datos del equipo (Computador o Dispositivo)
    if (asignacion.itemType === 'Computador') {
      equipoData = await prisma.computador.findUnique({
        where: { id: asignacion.computadorId ?? undefined },
        include: {
          modelo: {
            include: {
              marca: true, // Incluir la marca del modelo
            },
          },
          usuario: true, // Si el computador está directamente asignado a un usuario
          departamento: true, // Si el computador está directamente asignado a un departamento
        },
      });
    } else if (asignacion.itemType === 'Dispositivo') {
      equipoData = await prisma.dispositivo.findUnique({
        where: { id: asignacion.dispositivoId ?? undefined },
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
      });
    }

    // Obtener datos del objetivo (Usuario o Departamento) de la asignación
    if (asignacion.targetType === 'Usuario') {
      targetData = await prisma.usuario.findUnique({
        where: { id: asignacion.targetUsuarioId ?? undefined },
        include: {
          departamento: {
            include: {
              gerencia: true, // Incluir la gerencia del departamento
            },
          },
        },
      });
    } else if (asignacion.targetType === 'Departamento') {
      targetData = await prisma.departamento.findUnique({
        where: { id: asignacion.targetDepartamentoId ?? undefined },
        include: {
          gerencia: true,
        },
      });
    }

    if (!equipoData || !targetData) {
      return NextResponse.json({ message: 'Failed to retrieve full assignment details.' }, { status: 500 });
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
      worksheet.getCell('B5').value = `${targetData.nombre} ${targetData.apellido}`;
      worksheet.getCell('B6').value = asignacion.ced;
      worksheet.getCell('B7').value = targetData.cargo;
      worksheet.getCell('B8').value = targetData.legajo;
      worksheet.getCell('B9').value = targetData.sociedad;
      worksheet.getCell('B10').value = targetData.departamento.nombre;
      worksheet.getCell('B11').value = asignacion.localidad;
      worksheet.getCell('B12').value = asignacion.gerente;
      worksheet.getCell('B13').value = targetData.departamento.ceco;
      worksheet.getCell('B15').value = asignacion.motivo;
    } else { // targetType === 'Departamento'
      worksheet.getCell('B5').value = `Departamento: ${targetData.nombre}`;
      worksheet.getCell('B6').value = `Gerencia: ${targetData.gerencia.nombre}`;
      worksheet.getCell('B7').value = `CECO: ${targetData.ceco}`;
      worksheet.getCell('B8').value = `Sociedad: ${targetData.sociedad}`;
      worksheet.getCell('B9').value = '';
      worksheet.getCell('B10').value = '';
    }

    // Datos del Equipo
    worksheet.getCell('E4').value = `${equipoData.modelo.marca.nombre} ${equipoData.modelo.nombre}`; // Marca
    worksheet.getCell('E5').value = equipoData.serial;
    worksheet.getCell('B4').value = equipoData.modelo.tipo; // Tipo de equipo (Computador o Dispositivo)
    worksheet.getCell('B6').value = equipoData.nsap || ''; // NSAP (si aplica)


    if (asignacion.itemType === 'Computador') {
      worksheet.getCell('E6').value = equipoData.procesador || 'N/A';
        worksheet.getCell('E13').value = equipoData.sisOperativo || 'N/A';
      worksheet.getCell('E15').value = equipoData.sapVersion || 'N/A';
      worksheet.getCell('E14').value = equipoData.officeVersion || 'N/A';
    } else if (asignacion.itemType === 'Dispositivo') {
      // Si hay líneas telefónicas, puedes listarlas o poner la primera
      // Limpiar celdas de computador si el equipo es un dispositivo
      worksheet.getCell('B25').value = '';
      worksheet.getCell('B26').value = '';
      worksheet.getCell('B27').value = '';
      worksheet.getCell('B28').value = '';
      worksheet.getCell('B29').value = '';
      worksheet.getCell('B30').value = '';
      worksheet.getCell('B31').value = '';
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