/**
 * Setup de Testing
 * 
 * Este archivo se ejecuta ANTES de cada test.
 * Acá configuramos todo lo necesario para que los tests funcionen correctamente.
 */
import '@testing-library/jest-dom/vitest';
import { beforeAll, vi } from 'vitest';

/**
 * Mock de cookies - Simula las cookies de Next.js
 */
const mockCookies = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

/**
 * Mock de next/navigation
 */
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * Mock de next/headers - Este debe estar disponible para todos los tests
 */
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

/**
 * Configuración global
 */
beforeAll(() => {
  // Por defecto, retornar undefined (sin sesión)
  mockCookies.get.mockReturnValue(undefined);
});
