/**
 * ============================================
 * TEST DE AUTENTICACIÓN - API Auth Helper
 * ============================================
 * 
 * En este archivo vamos a probar el sistema de autenticación.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock del módulo auth completo - DEBE estar al nivel superior
vi.mock('@/lib/auth', () => ({
  decrypt: vi.fn(),
}));

// Importar después de los mocks
import { 
  getCurrentUser, 
  requireAuth, 
  requireAdmin, 
  requireRole 
} from '@/lib/api-auth';
import * as authModule from '@/lib/auth';

// Obtener referencia al mock de cookies
const mockCookies = vi.mocked(await import('next/headers')).cookies as ReturnType<typeof vi.fn>;

describe('API Auth Helper - getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset: sin sesión por defecto
    mockCookies.mockReturnValue({
      get: vi.fn(() => undefined),
      set: vi.fn(),
      delete: vi.fn(),
    });
  });

  it('debería retornar null cuando no hay cookie de sesión', async () => {
    const result = await getCurrentUser();
    expect(result).toBeNull();
  });

  it('debería retornar el usuario cuando la sesión es válida', async () => {
    const mockPayload = {
      sub: 'user-123',
      role: 'admin' as const,
      username: 'testuser',
    };

    // Configurar mock de cookies para retornar sesión
    const cookiesMock = {
      get: vi.fn(() => ({ name: 'session', value: 'token-valido' })),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(cookiesMock);

    vi.mocked(authModule.decrypt).mockResolvedValue(mockPayload);

    const result = await getCurrentUser();
    expect(result).toEqual(mockPayload);
  });

  it('debería retornar null cuando el token es inválido', async () => {
    const cookiesMock = {
      get: vi.fn(() => ({ name: 'session', value: 'token-invalido' })),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(cookiesMock);

    vi.mocked(authModule.decrypt).mockRejectedValue(new Error('Invalid token'));

    const result = await getCurrentUser();
    expect(result).toBeNull();
  });
});

describe('API Auth Helper - requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookies.mockReturnValue({
      get: vi.fn(() => undefined),
      set: vi.fn(),
      delete: vi.fn(),
    });
  });

  it('debería retornar error 401 cuando no hay usuario', async () => {
    const result = await requireAuth();
    
    expect(result).not.toBeNull();
    expect(result?.status).toBe(401);
  });

  it('debería retornar null cuando hay usuario autenticado', async () => {
    // Configurar sesión
    const cookiesMock = {
      get: vi.fn(() => ({ name: 'session', value: 'token' })),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(cookiesMock);

    vi.mocked(authModule.decrypt).mockResolvedValue({
      sub: 'user-123',
      role: 'user' as const,
      username: 'test',
    });
    
    const result = await requireAuth();
    expect(result).toBeNull();
  });
});

describe('API Auth Helper - requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería retornar error 401 cuando no hay sesión', async () => {
    mockCookies.mockReturnValue({
      get: vi.fn(() => undefined),
      set: vi.fn(),
      delete: vi.fn(),
    });
    
    const result = await requireAdmin();
    expect(result?.status).toBe(401);
  });

  it('debería retornar error 403 cuando el usuario no es admin', async () => {
    const cookiesMock = {
      get: vi.fn(() => ({ name: 'session', value: 'token' })),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(cookiesMock);

    vi.mocked(authModule.decrypt).mockResolvedValue({
      sub: 'user-123',
      role: 'user' as const,
      username: 'test',
    });
    
    const result = await requireAdmin();
    expect(result?.status).toBe(403);
  });

  it('debería retornar null cuando el usuario es admin', async () => {
    const cookiesMock = {
      get: vi.fn(() => ({ name: 'session', value: 'token' })),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(cookiesMock);

    vi.mocked(authModule.decrypt).mockResolvedValue({
      sub: 'admin-123',
      role: 'admin' as const,
      username: 'admin',
    });
    
    const result = await requireAdmin();
    expect(result).toBeNull();
  });
});

describe('API Auth Helper - requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería permitir acceso cuando el rol está en la lista permitida', async () => {
    const cookiesMock = {
      get: vi.fn(() => ({ name: 'session', value: 'token' })),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(cookiesMock);

    vi.mocked(authModule.decrypt).mockResolvedValue({
      sub: 'user-123',
      role: 'user' as const,
      username: 'test',
    });
    
    const result = await requireRole(['user', 'admin']);
    expect(result).toBeNull();
  });

  it('debería denegar acceso cuando el rol no está permitido', async () => {
    const cookiesMock = {
      get: vi.fn(() => ({ name: 'session', value: 'token' })),
      set: vi.fn(),
      delete: vi.fn(),
    };
    mockCookies.mockReturnValue(cookiesMock);

    vi.mocked(authModule.decrypt).mockResolvedValue({
      sub: 'user-123',
      role: 'user' as const,
      username: 'test',
    });
    
    const result = await requireRole(['admin']);
    expect(result?.status).toBe(403);
  });
});
