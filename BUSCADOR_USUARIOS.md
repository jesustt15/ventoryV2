# Buscador de Usuarios en la Barra Principal

## Descripción

Se ha implementado un buscador global de usuarios en la barra principal de la aplicación que permite buscar usuarios rápidamente y navegar directamente a su página de equipos asignados.

## Ubicación

- **Barra principal** (header/navbar) de la aplicación
- Ubicado en el centro de la barra, entre el botón del menú lateral y el botón de cambio de tema

## Características

### Búsqueda en Tiempo Real

- **Búsqueda instantánea**: Los resultados aparecen mientras escribes (con debounce de 300ms)
- **Mínimo de caracteres**: Requiere al menos 2 caracteres para iniciar la búsqueda
- **Límite de resultados**: Muestra hasta 10 usuarios como máximo
- **Búsqueda insensible a mayúsculas**: No distingue entre mayúsculas y minúsculas

### Campos de Búsqueda

El buscador busca en los siguientes campos:
- **Nombre** del usuario
- **Apellido** del usuario

### Información Mostrada

Cada resultado muestra:
1. **Avatar**: Icono circular con el icono de usuario
2. **Nombre completo**: Nombre y apellido del usuario
3. **Cargo**: Puesto o cargo del usuario
4. **Departamento**: Departamento al que pertenece

### Navegación

Al hacer clic en un resultado:
- Te redirige automáticamente a la página de **equipos asignados** del usuario
- Ruta: `/usuarios/{id}/asigned`
- El buscador se limpia y cierra automáticamente

## Uso

### Con el Mouse

1. **Hacer clic** en el campo de búsqueda
2. **Escribir** el nombre o apellido del usuario (mínimo 2 caracteres)
3. **Esperar** a que aparezcan los resultados (aparecen automáticamente)
4. **Hacer clic** en el usuario deseado para ir a su página de asignados

### Con el Teclado

1. **Hacer clic** en el campo de búsqueda o usar `Tab` para navegar hasta él
2. **Escribir** el nombre o apellido del usuario
3. **Usar las flechas** ↑ ↓ para navegar entre los resultados
4. **Presionar Enter** para seleccionar el usuario resaltado
5. **Presionar Escape** para cerrar el buscador

### Limpiar la Búsqueda

- **Botón X**: Aparece cuando hay texto en el campo, hace clic para limpiar
- **Escape**: Presionar la tecla Escape para cerrar el dropdown

## Comportamiento

### Estados del Buscador

1. **Vacío**: No muestra resultados
2. **Buscando**: Muestra "Buscando..." mientras se realiza la búsqueda
3. **Con resultados**: Muestra la lista de usuarios encontrados
4. **Sin resultados**: Muestra "No se encontraron usuarios"

### Cierre Automático

El dropdown de resultados se cierra automáticamente cuando:
- Haces clic fuera del buscador
- Presionas la tecla Escape
- Seleccionas un usuario

### Resaltado de Selección

- El resultado seleccionado con el teclado se resalta con un fondo diferente
- Al pasar el mouse sobre un resultado, también se resalta

## Ejemplos de Uso

### Ejemplo 1: Buscar por nombre

```
Escribir: "juan"
Resultados:
- Juan Pérez - Analista - IT
- Juan García - Desarrollador - Desarrollo
- Juana Martínez - Gerente - Ventas
```

### Ejemplo 2: Buscar por apellido

```
Escribir: "gonzalez"
Resultados:
- María González - Gerente - Ventas
- Pedro González - Técnico - Soporte
```

### Ejemplo 3: Búsqueda parcial

```
Escribir: "mar"
Resultados:
- María González - Gerente - Ventas
- Pedro Martínez - Desarrollador - IT
- Marco Silva - Analista - Finanzas
```

## Características Técnicas

### API Endpoint

- **Ruta**: `/api/usuarios/search`
- **Método**: GET
- **Parámetro**: `q` (query string)
- **Ejemplo**: `/api/usuarios/search?q=juan`

### Respuesta de la API

```json
[
  {
    "id": "uuid-del-usuario",
    "nombre": "Juan",
    "apellido": "Pérez",
    "nombreCompleto": "Juan Pérez",
    "departamento": "IT",
    "cargo": "Analista de Sistemas"
  }
]
```

### Optimizaciones

- **Debounce**: Espera 300ms después de que el usuario deja de escribir antes de buscar
- **Límite de resultados**: Solo devuelve 10 resultados para mejorar el rendimiento
- **Búsqueda eficiente**: Usa índices de base de datos para búsquedas rápidas
- **Ordenamiento**: Los resultados se ordenan alfabéticamente por nombre y apellido

### Accesibilidad

- **Navegación por teclado**: Totalmente funcional con flechas, Enter y Escape
- **Indicadores visuales**: Resaltado claro del elemento seleccionado
- **Texto alternativo**: Iconos con descripciones apropiadas
- **Contraste**: Colores que cumplen con estándares de accesibilidad

## Responsive Design

- **Desktop**: Ancho máximo de 28rem (max-w-md)
- **Tablet**: Se adapta al espacio disponible
- **Mobile**: Ocupa el ancho disponible en la barra

## Integración con el Sistema

### Relación con Otras Funcionalidades

- **Página de Asignados**: Al seleccionar un usuario, navega a su página de equipos asignados
- **Sidebar**: Complementa la navegación del menú lateral
- **Dashboard**: Proporciona acceso rápido desde cualquier página

### Permisos

- Disponible para todos los usuarios autenticados
- No requiere permisos especiales de administrador

## Notas de Desarrollo

### Componentes Creados

1. **UserSearch** (`src/components/user-search.tsx`): Componente principal del buscador
2. **API Route** (`src/app/api/usuarios/search/route.ts`): Endpoint de búsqueda

### Dependencias

- React hooks: `useState`, `useEffect`, `useRef`
- Next.js: `useRouter` para navegación
- Lucide React: Iconos `Search`, `User`, `X`
- shadcn/ui: Componente `Input`

### Estilos

- Usa Tailwind CSS para todos los estilos
- Soporta modo claro y oscuro automáticamente
- Animaciones suaves para transiciones

## Mejoras Futuras Posibles

1. **Búsqueda por legajo o cédula**: Agregar más campos de búsqueda
2. **Historial de búsquedas**: Guardar búsquedas recientes
3. **Favoritos**: Marcar usuarios frecuentemente consultados
4. **Búsqueda avanzada**: Filtros por departamento, cargo, etc.
5. **Atajos de teclado**: Ctrl+K o Cmd+K para abrir el buscador
6. **Resultados agrupados**: Agrupar por departamento o gerencia
