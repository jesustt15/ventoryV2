import { NextRequest, NextResponse } from 'next/server';
import { parseExcel, applyDispositivoBulkUpdate } from '@/lib/dispositivoBulkUpdate';

// Handler HTTP para Next.js App Router
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No se recibió ningún archivo en el campo "file".' },
        { status: 400 },
      );
    }

    const arrayBuffer = await (file as File).arrayBuffer();
    const rows = await parseExcel(arrayBuffer);
    const result = await applyDispositivoBulkUpdate(rows);
    console.log(result);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error en bulk-update dispositivos:', error);
    return NextResponse.json(
      { error: 'Error procesando el archivo de carga masiva.', detail: error?.message },
      { status: 500 },
    );
  }
}
