import { deleteSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    deleteSession();
    return NextResponse.json({ message: 'Logout exitoso' }, { status: 200 });
  } catch (error) {
    console.error('[LOGOUT_API_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}