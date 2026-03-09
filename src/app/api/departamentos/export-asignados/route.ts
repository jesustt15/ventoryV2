import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(request: NextRequest) {
  try {
    const { data, departamento } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { message: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Equipos Asignados");

    // Agregar título con el nombre del departamento
    worksheet.mergeCells("A1:G1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = `Equipos Asignados - ${departamento}`;
    titleCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    // Definir las columnas (empezando en la fila 2)
    worksheet.getRow(2).values = [
      "Tipo",
      "Serial/Número",
      "Marca",
      "Modelo",
      "Ubicación",
      "Fecha Asignación",
      "Asignado A",
    ];

    // Estilizar el encabezado de columnas
    worksheet.getRow(2).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    worksheet.getRow(2).alignment = { vertical: "middle", horizontal: "center" };

    // Definir anchos de columnas
    worksheet.columns = [
      { key: "tipo", width: 18 },
      { key: "serial", width: 20 },
      { key: "marca", width: 15 },
      { key: "modelo", width: 25 },
      { key: "ubicacion", width: 25 },
      { key: "fechaAsignacion", width: 18 },
      { key: "asignadoA", width: 30 },
    ];

    // Agregar los datos (empezando en la fila 3)
    data.forEach((item: any) => {
      worksheet.addRow(item);
    });

    // Aplicar bordes a todas las celdas con datos
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Generar el archivo Excel en un buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Retornar el archivo como respuesta
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${departamento}_asignados_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/departamentos/export-asignados]", error);
    return NextResponse.json(
      { message: "Error al generar el archivo Excel", error: error.message },
      { status: 500 }
    );
  }
}
