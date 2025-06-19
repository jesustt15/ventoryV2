import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

const publicRoutes = ['/'];
const protectedRoutes = [
  '/dashboard',
  '/asignaciones',
  '/computadores',
  '/departamentos',
  '/dispositivos',
  '/modelos',
  '/usuarios'
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  console.log(`[MIDDLEWARE] Ruta solicitada: ${path}`);
  
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // Desencriptar el token de la cookie
  const cookie = req.cookies.get('session');
  const session = cookie?.value ? await decrypt(cookie.value) : null;
  
  console.log(`[MIDDLEWARE] Sesión:`, session ? 'Activa' : 'Inactiva');
  
  // Lógica de redirección
  if (isProtectedRoute && !session) {
    console.log(`[MIDDLEWARE] Redirigiendo a login desde: ${path}`);
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  if (isPublicRoute && session) {
    console.log(`[MIDDLEWARE] Redirigiendo a dashboard desde: ${path}`);
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }
  
  console.log(`[MIDDLEWARE] Continuando a: ${path}`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};