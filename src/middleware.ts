import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

// 1. Especifica las rutas públicas y protegidas
const publicRoutes = ['/']; // La página de login es pública
const protectedRoutes = ['/dashboard', '/asignaciones', '/computadores', '/departamentos', '/dispositivos', '/modelos', '/usuarios'];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // 2. Desencripta el token de la cookie
  const cookie = req.cookies.get('session');
  const session = await decrypt(cookie?.value);

  // 3. Lógica de redirección
  if (isProtectedRoute && !session) {
    // Si el usuario no está autenticado y trata de acceder a una ruta protegida
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  if (isPublicRoute && session) {
    // Si el usuario está autenticado y trata de acceder a la página de login
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }
  
  // Si no se cumple ninguna de las condiciones anteriores, continúa con la solicitud
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};