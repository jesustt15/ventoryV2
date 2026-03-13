/**
 * ============================================
 * TEST DE COMPONENTES UI - Button Component
 * ============================================
 * 
 * En este archivo vamos a probar un componente de React.
 * 
 * Conceptos nuevos:
 * ---------------
 * 1. render() - Renderiza el componente en el DOM virtual
 * 2. screen - Objeto global que permite buscar elementos en el DOM
 * 3. fireEvent - Simula eventos del usuario (clics, typing, etc.)
 * 4. cleanup() - Limpia el DOM después de cada test
 * 
 * selectores útiles:
 * - getByText() - Busca por texto visible
 * - getByRole() - Busca por rol (button, link, etc.)
 * - getByTestId() - Busca por atributo data-testid
 * - getByPlaceholderText() - Busca por placeholder
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  /**
   * Test básico: el botón se renderiza con el texto correcto
   */
  it('debería renderizar el texto del botón', () => {
    // Renderizamos el componente
    render(<Button>Click me</Button>);
    
    // Buscamos el botón por su texto
    const button = screen.getByText('Click me');
    
    // Verificamos que existe
    expect(button).toBeInTheDocument();
  });

  /**
   * Test: verificar que es un elemento button
   */
  it('debería ser un elemento button', () => {
    render(<Button>Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');
  });

  /**
   * Test: el botón responde a clics
   */
  it('debería responder a clics', () => {
    // Creamos una función mock (simula una función del sistema)
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    // Obtenemos el botón
    const button = screen.getByRole('button');
    
    // Simulamos un clic
    fireEvent.click(button);
    
    // Verificamos que la función fue llamada
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  /**
   * Test: verificar variante "destructive" (para acciones peligrosas)
   */
  it('debería renderizar con variante destructive', () => {
    render(<Button variant="destructive">Eliminar</Button>);
    
    const button = screen.getByRole('button');
    // Verificamos que tiene la clase de destructivo
    expect(button).toHaveClass('bg-destructive');
  });

  /**
   * Test: verificar variante "outline"
   */
  it('debería renderizar con variante outline', () => {
    render(<Button variant="outline">Cancelar</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-input');
  });

  /**
   * Test: verificar tamaño "sm" (small)
   */
  it('debería renderizar con tamaño small', () => {
    render(<Button size="sm">Small</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-8');
    expect(button).toHaveClass('px-3');
  });

  /**
   * Test: verificar que el botón está deshabilitado
   */
  it('debería estar deshabilitado cuando disabled es true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  /**
   * Test: verificar que tiene las clases de disabled
   */
  it('debería tener clases de opacity cuando está deshabilitado', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('disabled:pointer-events-none');
    expect(button).toHaveClass('disabled:opacity-50');
  });
});

/**
 * ============================================
 * Resumen de conceptos aprendidos:
 * ============================================
 * 
 * render()           - Renderiza componente React en DOM virtual
 * screen.getByText() - Busca elemento por texto
 * screen.getByRole() - Busca elemento por rol (accesibilidad)
 * fireEvent.click()  - Simula evento de clic
 * expect().toBeInTheDocument() - Verifica que existe en el DOM
 * expect().toHaveBeenCalledTimes(n) - Verifica que función fue llamada n veces
 * expect().toHaveClass('clase') - Verifica que tiene clase CSS
 * expect().toBeDisabled() - Verifica que está deshabilitado
 */
