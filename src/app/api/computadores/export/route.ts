import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  // Solo usuarios autenticados pueden exportar
  const authError = await requireAuth();
  if (authError) return authError;
  
  try {
    const { data } = await request.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { message: "Datos inválidos" },
        { status: 400 }
      );
    }

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Computadores");

    // Definir las columnas
    worksheet.columns = [
      { header: "Serial", key: "serial", width: 20 },
      { header: "Marca", key: "marca", width: 15 },
      { header: "Modelo", key: "modelo", width: 25 },
      { header: "Tipo", key: "tipo", width: 12 },
      { header: "Host", key: "host", width: 20 },
      { header: "Sede", key: "sede", width: 10 },
      { header: "Estado", key: "estado", width: 15 },
      { header: "Asignado a", key: "asignadoA", width: 30 },
      { header: "Sistema Operativo", key: "sisOperativo", width: 20 },
      { header: "Procesador", key: "procesador", width: 30 },
      { header: "RAM", key: "ram", width: 15 },
      { header: "Almacenamiento", key: "almacenamiento", width: 15 },
      { header: "NSAP", key: "nsap", width: 15 },
      { header: "MAC WiFi", key: "macWifi", width: 20 },
      { header: "MAC Ethernet", key: "macEthernet", width: 20 },
    ];

    // Estilizar el encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4472C4" },
    };
    worksheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

    // Agregar los datos
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
        "Content-Disposition": `attachment; filename="computadores_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/computadores/export]", error);
    return NextResponse.json(
      { message: "Error al generar el archivo Excel", error: error.message },
      { status: 500 }
    );
  }
}
