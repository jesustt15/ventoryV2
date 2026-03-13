/**
 * ============================================
 * ¿Qué es un Test?
 * ============================================
 * 
 * Un test es una función que verifica que tu código funciona correctamente.
 * Imagínalo como un "examinador" que prueba tu código automáticamente.
 * 
 * ¿Por qué son importantes?
 * 1. **Detectan errores temprano** - Antes de que el usuario los encuentre
 * 2. **Previenen regresiones** - Si cambias algo, los tests te avisan si rompiste algo que funcionaba
 * 3. **Documentación** - Los tests muestran cómo se supposed usar tu código
 * 4. **Confianza** - Puedes hacer cambios grandes sin miedo a romper todo
 * 
 * ============================================
 * Estructura básica de un test (AAA Pattern)
 * ============================================
 * 
 * 1. Arrange (Preparar) - Configurar el entorno, datos, mocks
 * 2. Act (Actuar) - Ejecutar la función que queremos probar
 * 3. Assert (Afirmar) - Verificar que el resultado es el esperado
 * 
 * ============================================
 * Comandos disponibles
 * ============================================
 * 
 * npm test         - Ejecutar tests en modo watch (recomendado para desarrollo)
 * npm run test:run - Ejecutar tests una sola vez
 * npm run test:coverage - Ver cobertura de código
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (classnames utility)', () => {
  /**
   * it() = test individual
   * - Primer argumento: descripción de qué probamos
   * - Segundo argumento: función con el test
   */
  
  it('debería combinar dos clases simples', () => {
    // Arrange (preparar)
    const class1 = 'bg-red-500';
    const class2 = 'text-white';
    
    // Act (actuar) - ejecutar la función
    const resultado = cn(class1, class2);
    
    // Assert (afirmar) - verificar el resultado
    expect(resultado).toBe('bg-red-500 text-white');
  });

  it('debería manejar clases condicionales', () => {
    const baseClass = 'px-4 py-2';
    const condicion = true;
    
    // cn() debería incluir la clase condicional solo si es true
    const resultado = cn(baseClass, condicion && 'bg-blue-500');
    
    expect(resultado).toContain('px-4 py-2');
    expect(resultado).toContain('bg-blue-500');
  });

  it('debería manejar valores falsos gracefully', () => {
    const resultado = cn('clase-valida', false && 'clase-falsa', null, undefined);
    
    expect(resultado).toBe('clase-valida');
  });

  it('debería fusionar clases de Tailwind duplicadas', () => {
    // cn usa tailwind-merge que resuelve conflictos
    const resultado = cn('px-4 p-2'); // ambos son padding
    
    // El último valor debería ganar (p-2 = 0.5rem, px-4 = 1rem)
    expect(resultado).toBe('p-2');
  });
});

/**
 * ============================================
 * Tipos de assertions (afirmaciones) comunes
 * ============================================
 * 
 * expect(valor).toBe(valorEsperado)     - Igualdad exacta
 * expect(valor).toEqual(obj)            - Igualdad de objetos
 * expect(valor).toBeTruthy()            - Es verdadero
 * expect(valor).toBeFalsy()             - Es falso
 * expect(valor).toBeNull()              - Es null
 * expect(valor).toBeUndefined()        - Es undefined
 * expect(valor).toContain(algo)         - Contiene algo
 * expect(valor).toHaveLength(n)         - Tiene longitud n
 * expect(fn).toThrow()                  - Lanza un error
 * expect(valor).toBeGreaterThan(n)      - Es mayor que n
 * expect(valor).toMatch(/regex/)        - Cumple regex
 * 
 * ============================================
 * describe() = agrupar tests relacionados
 * ============================================
 * 
 * describe('Nombre del módulo', () => {
 *    test1...
 *    test2...
 * })
 */
