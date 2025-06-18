import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.JWT_SECRET_KEY;
const encodedKey = new TextEncoder().encode(secretKey);

export interface UserJwtPayload {
  sub: string; // 'sub' (subject) es el estándar para el ID de usuario
  role: 'user' | 'admin';
  jti?: string; // JWT ID
  iat?: number; // Issued at
  exp?: number; // Expiration time
  [key: string]: unknown; // Index signature for compatibility with JWTPayload
}

// Función para encriptar (firmar) un payload y crear un JWT
export async function encrypt(payload: UserJwtPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Expira en 7 días
    .sign(encodedKey);
}

// Función para desencriptar (verificar) un JWT
export async function decrypt(session: string | undefined = ''): Promise<UserJwtPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify<UserJwtPayload>(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    return null;
  }
}

// Función para crear la cookie de sesión
export async function createSession(userId: string, role: 'user' | 'admin') {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
  const session = await encrypt({ sub: userId, role, exp: expires.getTime() / 1000 });

  cookies().set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

// Función para eliminar la cookie de sesión (logout)
export function deleteSession() {
  cookies().delete('session');
}