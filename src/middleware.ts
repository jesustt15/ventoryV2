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

// Rutas exclusivas para admin
const adminOnlyRoutes = [
  '/usuarios/',
  '/modelos/',
  '/departamentos/',
  '/user/',
  '/lineas/',
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  console.log(`[MIDDLEWARE] Ruta solicitada: ${path}`);
  
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);
  const isAdminRoute = adminOnlyRoutes.some(route => path.startsWith(route));

  // Desencriptar el token de la cookie
  const cookie = req.cookies.get('session');
  const session = cookie?.value ? await decrypt(cookie.value) : null;
  
  console.log(`[MIDDLEWARE] Sesión:`, session ? 'Activa' : 'Inactiva');
  console.log(`[MIDDLEWARE] Usuario:`, session?.role|| 'No autenticado');

  // Redirigir si no está autenticado en ruta protegida
  if (isProtectedRoute && !session) {
    console.log(`[MIDDLEWARE] Redirigiendo a login desde: ${path}`);
    return NextResponse.redirect(new URL('/', req.nextUrl));
  }

  // Redirigir si está autenticado y accede a ruta pública
  if (isPublicRoute && session) {
    console.log(`[MIDDLEWARE] Redirigiendo a dashboard desde: ${path}`);
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  // Verificar permisos de admin
  if (isAdminRoute && session?.role !== 'admin') {
    console.log(`[MIDDLEWARE] Acceso denegado a ruta admin: ${path}`);
    // Puedes redirigir a una página de no autorizado o al dashboard
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
    // O también podrías mostrar una página 403:
    // return NextResponse.rewrite(new URL('/403', req.nextUrl));
  }
  
  console.log(`[MIDDLEWARE] Continuando a: ${path}`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}