/**
 * Helper de autenticación para APIs
 * Proporciona funciones para verificar sesión y roles de usuario
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt, UserJwtPayload } from '@/lib/auth';

/**
 * Obtiene el usuario de la sesión actual
 * @returns El payload del JWT o null si no hay sesión
 */
export async function getCurrentUser(): Promise<UserJwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;
    
    if (!session) {
      return null;
    }
    
    const payload = await decrypt(session);
    return payload;
  } catch (error) {
    console.error('[AUTH_HELPER] Error getting current user:', error);
    return null;
  }
}

/**
 * Verifica que el usuario esté autenticado
 * @param message - Mensaje de error personalizado (opcional)
 * @returns NextResponse con error 401 si no está autenticado, null si está ok
 */
export async function requireAuth(message: string = 'No autenticado'): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: message },
      { status: 401 }
    );
  }
  
  return null;
}

/**
 * Verifica que el usuario tenga el rol de admin
 * @param message - Mensaje de error personalizado (opcional)
 * @returns NextResponse con error 403 si no es admin, null si está ok
 */
export async function requireAdmin(message: string = 'Se requiere rol de administrador'): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  
  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: message },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Verifica que el usuario tenga uno de los roles permitidos
 * @param allowedRoles - Array de roles permitidos
 * @param message - Mensaje de error personalizado (opcional)
 * @returns NextResponse con error 403 si no tiene permiso, null si está ok
 */
export async function requireRole(
  allowedRoles: ('user' | 'admin')[],
  message: string = 'No tienes permiso para realizar esta acción'
): Promise<NextResponse | null> {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    );
  }
  
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: message },
      { status: 403 }
    );
  }
  
  return null;
}

/**
 * Wrapper para verificar autenticación en handlers de API
 * @param handler - Función handler a ejecutar si está autenticado
 * @returns Función wrapper que incluye verificación
 */
export function withAuth<T>(
  handler: (user: UserJwtPayload) => Promise<T>
) {
  return async function (): Promise<T | NextResponse> {
    const authError = await requireAuth();
    if (authError) {
      return authError;
    }
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No se pudo obtener información del usuario' },
        { status: 500 }
      );
    }
    
    return handler(user);
  };
}

/**
 * Wrapper para verificar rol de admin en handlers de API
 * @param handler - Función handler a ejecutar si es admin
 * @returns Función wrapper que incluye verificación de admin
 */
export function withAdmin<T>(
  handler: (user: UserJwtPayload) => Promise<T>
) {
  return async function (): Promise<T | NextResponse> {
    const authError = await requireAdmin();
    if (authError) {
      return authError;
    }
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No se pudo obtener información del usuario' },
        { status: 500 }
      );
    }
    
    return handler(user);
  };
}

/**
 * Wrapper para verificar roles específicos en handlers de API
 * @param allowedRoles - Array de roles permitidos
 * @param handler - Función handler a ejecutar si tiene el rol
 * @returns Función wrapper que incluye verificación de roles
 */
export function withRole<T>(
  allowedRoles: ('user' | 'admin')[],
  handler: (user: UserJwtPayload) => Promise<T>
) {
  return async function (): Promise<T | NextResponse> {
    const authError = await requireRole(allowedRoles);
    if (authError) {
      return authError;
    }
    
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No se pudo obtener información del usuario' },
        { status: 500 }
      );
    }
    
    return handler(user);
  };
}
