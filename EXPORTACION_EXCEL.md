# Funcionalidad de Exportación a Excel - Computadores, Dispositivos, Departamentos y Usuarios

## Cambios Implementados

### COMPUTADORES

### 1. Columna "Host" agregada a la tabla
- Se agregó la columna "Host" en la tabla de computadores
- Incluye filtro desplegable para filtrar por host
- Muestra "N/A" cuando no hay valor

### 2. Botón de Exportación a Excel
- Ubicación: En la barra de herramientas de la tabla, junto al botón "Agregar Computador"
- Funcionalidad: Exporta SOLO los registros que están visibles según los filtros aplicados
- Nombre del archivo: `computadores_YYYY-MM-DD.xlsx`

### 3. Columnas incluidas en el Excel de Computadores

El archivo Excel generado incluye las siguientes columnas:

1. **Serial** - Número de serie del equipo
2. **Marca** - Marca del modelo (HP, Dell, etc.)
3. **Modelo** - Nombre del modelo
4. **Tipo** - Tipo de equipo (Laptop, Desktop, etc.)
5. **Host** - Nombre del host de la máquina
6. **Sede** - Ubicación física (PZO, MCPA, CCS, ESP)
7. **Estado** - Estado del equipo (Asignado, Resguardo, etc.)
8. **Asignado a** - Nombre del usuario o departamento (si está asignado)
9. **Sistema Operativo** - SO instalado
10. **Procesador** - Modelo del procesador
11. **RAM** - Memoria RAM
12. **Almacenamiento** - Capacidad de almacenamiento
13. **NSAP** - Código NSAP
14. **MAC WiFi** - Dirección MAC de WiFi
15. **MAC Ethernet** - Dirección MAC de Ethernet

---

### DISPOSITIVOS

### 1. Botón de Exportación a Excel
- Ubicación: En la barra de herramientas de la tabla, junto al selector de columnas
- Funcionalidad: Exporta SOLO los registros que están visibles según los filtros aplicados
- Nombre del archivo: `dispositivos_YYYY-MM-DD.xlsx`

### 2. Columnas incluidas en el Excel de Dispositivos

El archivo Excel generado incluye las siguientes columnas:

1. **Serial** - Número de serie del dispositivo
2. **Marca** - Marca del modelo
3. **Modelo** - Nombre del modelo
4. **Sede** - Ubicación física (PZO, MCPA, CCS, ESP)
5. **Estado** - Estado del dispositivo (Asignado, Resguardo, etc.)
6. **Ubicación** - Ubicación específica del dispositivo
7. **NSAP** - Código NSAP
8. **MAC** - Dirección MAC del dispositivo

---

### DEPARTAMENTOS - EQUIPOS ASIGNADOS

### 1. Botón de Exportación a Excel
- Ubicación: En la página de equipos asignados al departamento, junto a las pestañas
- Funcionalidad: Exporta TODOS los equipos asignados al departamento (computadores, dispositivos y líneas telefónicas)
- Nombre del archivo: `[NombreDepartamento]_asignados_YYYY-MM-DD.xlsx`

### 2. Columnas incluidas en el Excel de Departamentos

El archivo Excel generado incluye:

1. **Tipo** - Tipo de equipo (Computador, Dispositivo, Línea Telefónica)
2. **Serial/Número** - Serial del equipo o número de línea
3. **Marca** - Marca del equipo
4. **Modelo** - Modelo del equipo
5. **Ubicación** - Ubicación física del equipo
6. **Fecha Asignación** - Fecha en que fue asignado
7. **Asignado A** - Usuario específico o "Departamento"

### 3. Características especiales
- Incluye un título con el nombre del departamento
- Agrupa todos los tipos de equipos en un solo archivo
- Formato con colores distintivos (título azul, encabezados azul claro)

---

### USUARIOS - EQUIPOS ASIGNADOS

### 1. Botón de Exportación a Excel
- Ubicación: En la página de equipos asignados al usuario, junto a las pestañas
- Funcionalidad: Exporta TODOS los equipos asignados al usuario (computadores, dispositivos y líneas telefónicas)
- Nombre del archivo: `[Nombre]_[Apellido]_asignados_YYYY-MM-DD.xlsx`

### 2. Columnas incluidas en el Excel de Usuarios

El archivo Excel generado incluye:

1. **Tipo** - Tipo de equipo (Computador, Dispositivo, Línea Telefónica)
2. **Serial/Número** - Serial del equipo o número de línea
3. **Marca** - Marca del equipo
4. **Modelo** - Modelo del equipo
5. **Ubicación** - Ubicación física del equipo
6. **Fecha Asignación** - Fecha en que fue asignado

### 3. Características especiales
- Incluye un título con el nombre completo del usuario
- Agrupa todos los tipos de equipos en un solo archivo
- Formato con colores distintivos (título azul, encabezados azul claro)

---

## Formato del Excel (Todos)

- Encabezados con fondo azul y texto blanco en negrita
- Todas las celdas con bordes
- Columnas con anchos ajustados automáticamente
- Alineación centrada en los encabezados
- Títulos personalizados para departamentos y usuarios

## Cómo usar

### Para Computadores y Dispositivos:

1. **Aplicar filtros** (opcional):
   - Usa los filtros de las columnas (Marca, Modelo, Tipo, Host, Sede, Estado)
   - Usa la búsqueda por serial
   - Usa el selector de columnas visibles

2. **Exportar**:
   - Haz clic en el botón "Exportar Excel"
   - El archivo se descargará automáticamente
   - Solo se exportarán los registros que coincidan con los filtros aplicados

### Para Departamentos y Usuarios:

1. **Navegar a la página de asignados**:
   - Ir a la página de detalles del departamento o usuario
   - Hacer clic en la sección de "Equipos Asignados"

2. **Exportar**:
   - Haz clic en el botón "Exportar Todo a Excel"
   - El archivo se descargará automáticamente con todos los equipos asignados
   - Incluye computadores, dispositivos y líneas telefónicas en un solo archivo

3. **Resultado**:
   - Archivo Excel listo para usar
   - Formato profesional con título personalizado
   - Todos los datos relevantes incluidos

## Ejemplos de uso

### COMPUTADORES

#### Caso 1: Exportar todos los computadores
- No aplicar ningún filtro
- Clic en "Exportar Excel"
- Se exportan TODOS los registros

#### Caso 2: Exportar solo laptops HP en sede PZO
- Filtrar por Marca: "HP"
- Filtrar por Tipo: "Laptop"
- Filtrar por Sede: "PZO"
- Clic en "Exportar Excel"
- Se exportan SOLO los registros que cumplan estos criterios

#### Caso 3: Exportar equipos asignados con un host específico
- Filtrar por Estado: "Asignado"
- Filtrar por Host: seleccionar el host deseado
- Clic en "Exportar Excel"
- Se exportan SOLO los equipos asignados con ese host

### DISPOSITIVOS

#### Caso 1: Exportar todos los dispositivos
- No aplicar ningún filtro
- Clic en "Exportar Excel"
- Se exportan TODOS los registros

#### Caso 2: Exportar solo impresoras en sede CCS
- Filtrar por Modelo: seleccionar modelos de impresoras
- Filtrar por Sede: "CCS"
- Clic en "Exportar Excel"
- Se exportan SOLO los dispositivos que cumplan estos criterios

### DEPARTAMENTOS

#### Caso 1: Exportar todos los equipos del departamento de IT
- Ir a la página de equipos asignados del departamento IT
- Clic en "Exportar Todo a Excel"
- Se exportan TODOS los equipos asignados (computadores, dispositivos, líneas)

### USUARIOS

#### Caso 1: Exportar todos los equipos de Juan Pérez
- Ir a la página de equipos asignados de Juan Pérez
- Clic en "Exportar Todo a Excel"
- Se exportan TODOS los equipos asignados al usuario

## Notas técnicas

- La exportación se realiza en el cliente (navegador)
- Los datos se envían al servidor para generar el Excel
- El archivo se genera usando la librería ExcelJS
- No hay límite en la cantidad de registros a exportar
- Los valores nulos o vacíos se muestran como "N/A"
- Los filtros aplicados en la tabla se respetan al 100% en la exportación (solo para computadores y dispositivos)
- Para departamentos y usuarios, se exportan TODOS los equipos asignados sin filtros
