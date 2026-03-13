import { NextRequest, NextResponse } from 'next/server';
import { parseUsuarioExcel, applyUsuarioBulkUpdate } from '@/lib/usuarioBulkUpdate';
import { requireAdmin } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  // Solo admin puede hacer bulk update de usuarios
  const authError = await requireAdmin();
  if (authError) return authError;
  
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
    const buffer = Buffer.from(arrayBuffer);
    
    const rows = await parseUsuarioExcel(buffer);
    const result = await applyUsuarioBulkUpdate(rows);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('Error en bulk-update de usuarios:', error);
    return NextResponse.json(
      { error: 'Error procesando el archivo de carga masiva.', detail: error?.message },
      { status: 500 },
    );
  }
}
