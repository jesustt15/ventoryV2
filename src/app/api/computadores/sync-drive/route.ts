import { NextRequest, NextResponse } from 'next/server';
import { parseExcel, applyComputadorBulkUpdate } from '@/lib/computadorBulkUpdate';

function getDriveDownloadUrl(request: NextRequest): string | null {
  const urlParam = request.nextUrl.searchParams.get('fileUrl');
  if (urlParam) return urlParam;

  const envUrl = process.env.GDRIVE_EXCEL_URL;
  if (envUrl) return envUrl;

  const fileId = process.env.GDRIVE_FILE_ID;
  if (!fileId) return null;

  // URL estándar para exportar una hoja de cálculo de Google como XLSX
  return `https://docs.google.com/spreadsheets/d/${fileId}/export?format=xlsx`;
}

export async function POST(request: NextRequest) {
  try {
    const downloadUrl = getDriveDownloadUrl(request);

    if (!downloadUrl) {
      return NextResponse.json(
        {
          message:
            'No se encontró configuración de Drive. Define GDRIVE_EXCEL_URL o GDRIVE_FILE_ID en el .env, o pasa ?fileUrl=...',
        },
        { status: 400 }
      );
    }

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      return NextResponse.json(
        { message: 'No se pudo descargar el archivo desde Google Drive.', status: response.status },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedRows = await parseExcel(buffer);

    if (parsedRows.length === 0) {
      return NextResponse.json(
        { message: 'El archivo descargado no contiene filas de datos.', totalRows: 0 },
        { status: 400 }
      );
    }

    const { summary, results } = await applyComputadorBulkUpdate(parsedRows);

    return NextResponse.json(
      {
        source: 'google-drive',
        downloadUrl,
        summary,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SYNC_DRIVE_COMPUTADORES]', error);
    return NextResponse.json(
      { message: 'Error sincronizando desde Google Drive', error: (error as Error).message },
      { status: 500 }
    );
  }
}

