import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth-server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logout exitoso' }, { status: 200 });
    
    // Eliminar la cookie de sesión correctamente
    response.cookies.set({
      name: 'session',
      value: '',
      expires: new Date(0), // Fecha en el pasado
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('[LOGOUT_ERROR]', error);
    return NextResponse.json(
      { message: 'Error al cerrar sesión' }, 
      { status: 500 }
    );
  }
}