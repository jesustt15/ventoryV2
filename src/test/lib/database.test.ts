/**
 * ============================================
 * TEST DE BASE DE DATOS - Prisma Queries
 * ============================================
 * 
 * En este archivo vamos a probar queries de base de datos.
 * 
 * ¿Por qué no conectamos a la BD real?
 * ------------------------------------
 * 1. Los tests serían lentos
 * 2. Dependerían de datos existentes
 * 3. Podríamos modificar datos reales por error
 * 
 * Solución: Mock de Prisma
 * Usamos vi.mock() para simular el cliente de Prisma
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de Prisma - Simula el cliente de base de datos
const mockPrisma = {
  usuario: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  computador: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  departamento: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  asignaciones: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
};

// Mock del módulo prisma
vi.mock('@/lib/prisma', () => ({
  default: mockPrisma,
}));

describe('Database Queries - Usuario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Buscar todos los usuarios
   */
  it('debería retornar todos los usuarios', async () => {
    const mockUsuarios = [
      { id: '1', nombre: 'Juan', apellido: 'Perez', legajo: 123 },
      { id: '2', nombre: 'Maria', apellido: 'Garcia', legajo: 124 },
    ];

    // Configurar el mock
    mockPrisma.usuario.findMany.mockResolvedValue(mockUsuarios);

    // Importar y usar
    const { default: prisma } = await import('@/lib/prisma');
    const usuarios = await prisma.usuario.findMany();

    expect(usuarios).toHaveLength(2);
    expect(usuarios[0].nombre).toBe('Juan');
    expect(mockPrisma.usuario.findMany).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: Buscar usuario por ID
   */
  it('debería retornar un usuario por ID', async () => {
    const mockUsuario = { id: '1', nombre: 'Juan', apellido: 'Perez' };

    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario);

    const { default: prisma } = await import('@/lib/prisma');
    const usuario = await prisma.usuario.findUnique({
      where: { id: '1' },
    });

    expect(usuario).toEqual(mockUsuario);
    expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });

  /**
   * Test: Retornar null cuando no existe el usuario
   */
  it('debería retornar null cuando el usuario no existe', async () => {
    mockPrisma.usuario.findUnique.mockResolvedValue(null);

    const { default: prisma } = await import('@/lib/prisma');
    const usuario = await prisma.usuario.findUnique({
      where: { id: 'no-existe' },
    });

    expect(usuario).toBeNull();
  });

  /**
   * Test: Crear usuario
   */
  it('debería crear un nuevo usuario', async () => {
    const nuevoUsuario = {
      nombre: 'Carlos',
      apellido: 'Lopez',
      legajo: 125,
      cargo: 'Desarrollador',
      ced: '12345678',
      departamentoId: 'dept-1',
    };

    const usuarioCreado = { id: 'nuevo-1', ...nuevoUsuario };

    mockPrisma.usuario.create.mockResolvedValue(usuarioCreado);

    const { default: prisma } = await import('@/lib/prisma');
    const resultado = await prisma.usuario.create({
      data: nuevoUsuario,
    });

    expect(resultado.id).toBe('nuevo-1');
    expect(resultado.nombre).toBe('Carlos');
    expect(mockPrisma.usuario.create).toHaveBeenCalledWith({
      data: nuevoUsuario,
    });
  });

  /**
   * Test: Actualizar usuario
   */
  it('debería actualizar un usuario', async () => {
    const usuarioActualizado = {
      id: '1',
      nombre: 'Juan Actualizado',
      apellido: 'Perez',
    };

    mockPrisma.usuario.update.mockResolvedValue(usuarioActualizado);

    const { default: prisma } = await import('@/lib/prisma');
    const resultado = await prisma.usuario.update({
      where: { id: '1' },
      data: { nombre: 'Juan Actualizado' },
    });

    expect(resultado.nombre).toBe('Juan Actualizado');
  });

  /**
   * Test: Eliminar usuario
   */
  it('debería eliminar un usuario', async () => {
    mockPrisma.usuario.delete.mockResolvedValue({ id: '1' } as any);

    const { default: prisma } = await import('@/lib/prisma');
    
    await prisma.usuario.delete({ where: { id: '1' } });

    expect(mockPrisma.usuario.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });
});

describe('Database Queries - Buscar con filtros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Buscar computadores con filtro de estado
   */
  it('debería buscar computadores por estado', async () => {
    const mockComputadores = [
      { id: '1', serial: 'ABC123', estado: 'Asignado' },
      { id: '2', serial: 'DEF456', estado: 'Asignado' },
    ];

    mockPrisma.computador.findMany.mockResolvedValue(mockComputadores);

    const { default: prisma } = await import('@/lib/prisma');
    const computadores = await prisma.computador.findMany({
      where: { estado: 'Asignado' },
    });

    expect(computadores).toHaveLength(2);
    expect(mockPrisma.computador.findMany).toHaveBeenCalledWith({
      where: { estado: 'Asignado' },
    });
  });

  /**
   * Test: Contar computadores
   */
  it('debería contar computadores', async () => {
    mockPrisma.computador.count.mockResolvedValue(150);

    const { default: prisma } = await import('@/lib/prisma');
    const total = await prisma.computador.count();

    expect(total).toBe(150);
    expect(mockPrisma.computador.count).toHaveBeenCalled();
  });

  /**
   * Test: Buscar con include (relaciones)
   */
  it('debería buscar usuarios con departamento', async () => {
    const mockUsuario = {
      id: '1',
      nombre: 'Juan',
      departamento: {
        id: 'dept-1',
        nombre: 'IT',
      },
    };

    mockPrisma.usuario.findUnique.mockResolvedValue(mockUsuario);

    const { default: prisma } = await import('@/lib/prisma');
    const usuario = await prisma.usuario.findUnique({
      where: { id: '1' },
      include: { departamento: true },
    });

    expect(usuario?.departamento?.nombre).toBe('IT');
    expect(mockPrisma.usuario.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      include: { departamento: true },
    });
  });
});

describe('Database Queries - Búsqueda avanzada', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Búsqueda con OR (cualquiera de las condiciones)
   */
  it('debería buscar con condición OR', async () => {
    const mockComputadores = [
      { id: '1', serial: 'ABC123', estado: 'Asignado' },
    ];

    mockPrisma.computador.findMany.mockResolvedValue(mockComputadores);

    const { default: prisma } = await import('@/lib/prisma');
    const computadores = await prisma.computador.findMany({
      where: {
        OR: [
          { usuarioId: { not: null } },
          { departamentoId: { not: null } },
        ],
      },
    });

    expect(computadores).toHaveLength(1);
  });

  /**
   * Test: Búsqueda con AND (todas las condiciones)
   */
  it('debería buscar con condición AND', async () => {
    const mockComputadores = [
      { id: '1', serial: 'ABC123', estado: 'Asignado', modeloId: 'mod-1' },
    ];

    mockPrisma.computador.findMany.mockResolvedValue(mockComputadores);

    const { default: prisma } = await import('@/lib/prisma');
    const computadores = await prisma.computador.findMany({
      where: {
        AND: [
          { estado: 'Asignado' },
          { modeloId: 'mod-1' },
        ],
      },
    });

    expect(computadores).toHaveLength(1);
  });

  /**
   * Test: Búsqueda con like (contains)
   */
  it('debería buscar usuarios por nombre contendo texto', async () => {
    const mockUsuarios = [
      { id: '1', nombre: 'Juan', apellido: 'Perez' },
      { id: '2', nombre: 'Juan Carlos', apellido: 'Gomez' },
    ];

    mockPrisma.usuario.findMany.mockResolvedValue(mockUsuarios);

    const { default: prisma } = await import('@/lib/prisma');
    const usuarios = await prisma.usuario.findMany({
      where: {
        nombre: { contains: 'Juan', mode: 'insensitive' },
      },
    });

    expect(usuarios).toHaveLength(2);
  });
});

/**
 * ============================================
 * Resumen de conceptos aprendidos:
 * ============================================
 * 
 * vi.mock()        - Simula un módulo completo
 * mockResolvedValue() - Retorna un valor cuando se llama la función
 * mockRejectedValue() - Simula un error
 * toHaveBeenCalledWith() - Verifica con qué parámetros se llamó
 * 
 * Métodos comunes de Prisma:
 * - findMany()     - Buscar varios registros
 * - findUnique()   - Buscar uno (por ID o unique)
 * - create()       - Crear registro
 * - update()       - Actualizar registro
 * - delete()       - Eliminar registro
 * - count()        - Contar registros
 * 
 * where options:
 * - where: { campo: valor }
 * - where: { campo: { equals: valor } }
 * - where: { campo: { contains: valor } }
 * - where: { OR: [condición1, condición2] }
 * - where: { AND: [condición1, condición2] }
 */
