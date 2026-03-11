# Funcionalidad de Carga Masiva de Usuarios

## Descripción

Esta funcionalidad permite importar y actualizar usuarios de forma masiva mediante un archivo Excel. Si el usuario no existe en la base de datos, se crea automáticamente. Si ya existe, se actualizan sus datos.

## Ubicación

- **Página**: `/usuarios`
- **Botón**: "Subir Excel" (ubicado junto al título "Usuarios")

## Formato del Archivo Excel

El archivo Excel debe contener las siguientes columnas (los nombres pueden variar):

### Columnas Obligatorias

1. **Legajo** (obligatorio)
   - Nombres aceptados: `legajo`, `nro legajo`, `numero legajo`, `no legajo`
   - Tipo: Número entero
   - Ejemplo: `12345`

2. **Cédula** (obligatorio)
   - Nombres aceptados: `cedula`, `cédula`, `ci`, `ced`, `documento`
   - Tipo: Texto
   - Ejemplo: `V-12345678`

### Columnas Opcionales (requeridas para crear nuevos usuarios)

3. **Nombre**
   - Nombres aceptados: `nombre`, `nombres`
   - Tipo: Texto
   - Ejemplo: `Juan`

4. **Apellido**
   - Nombres aceptados: `apellido`, `apellidos`
   - Tipo: Texto
   - Ejemplo: `Pérez`

5. **Cargo**
   - Nombres aceptados: `cargo`, `puesto`, `posicion`, `posición`
   - Tipo: Texto
   - Ejemplo: `Analista de Sistemas`

6. **Departamento**
   - Nombres aceptados: `departamento`, `depto`, `area`, `área`
   - Tipo: Texto (debe coincidir exactamente con un departamento existente)
   - Ejemplo: `IT`

## Comportamiento

### Caso 1: Usuario NO existe (crear)

Para crear un nuevo usuario, el archivo Excel debe contener:
- Legajo (obligatorio)
- Cédula (obligatorio)
- Nombre (obligatorio)
- Apellido (obligatorio)
- Cargo (obligatorio)
- Departamento (obligatorio y debe existir en la BD)

Si falta alguno de estos datos, el usuario NO se creará y se mostrará un mensaje de error.

### Caso 2: Usuario existe (actualizar)

Si el usuario ya existe (se busca por legajo), se actualizarán los campos que hayan cambiado:
- Cédula
- Nombre
- Apellido
- Cargo
- Departamento (si el departamento existe en la BD)

Si no hay cambios, se reportará "Sin cambios respecto a la base de datos".

## Ejemplo de Archivo Excel

| Legajo | Cédula      | Nombre | Apellido | Cargo              | Departamento |
|--------|-------------|--------|----------|--------------------|--------------|
| 12345  | V-12345678  | Juan   | Pérez    | Analista           | IT           |
| 12346  | V-87654321  | María  | González | Gerente            | Ventas       |
| 12347  | V-11223344  | Pedro  | Martínez | Desarrollador      | IT           |

## Proceso de Carga

1. **Preparar el archivo Excel** con las columnas mencionadas
2. **Ir a la página de Usuarios** (`/usuarios`)
3. **Hacer clic en "Subir Excel"**
4. **Seleccionar el archivo** desde tu computadora
5. **Esperar la confirmación** con el resumen de la operación

## Resultado

Al finalizar la carga, se mostrará un mensaje con:
- **Creados**: Cantidad de usuarios nuevos agregados
- **Actualizados**: Cantidad de usuarios existentes modificados
- **No procesados**: Cantidad de registros que no pudieron procesarse

## Advertencias y Errores

### Advertencias (el proceso continúa)

- **Departamento no existe**: Si el departamento especificado no existe en la base de datos, se mostrará una advertencia pero el resto de los datos se procesarán (si es actualización) o no se creará el usuario (si es creación).

### Errores (el registro no se procesa)

- **Faltan columnas obligatorias**: El archivo debe tener al menos las columnas de legajo y cédula.
- **Usuario nuevo sin datos completos**: Para crear un usuario nuevo se requieren todos los campos obligatorios.
- **Formato de archivo incorrecto**: El archivo debe ser .xlsx o .xls válido.

## Notas Técnicas

- La búsqueda de usuarios se realiza por **legajo** (campo único)
- La búsqueda de departamentos es **case-insensitive** (no distingue mayúsculas/minúsculas)
- Los nombres de columnas también son **case-insensitive** y se eliminan acentos para mayor flexibilidad
- El proceso se ejecuta en una transacción, por lo que si hay un error crítico, no se aplicará ningún cambio
- Los valores vacíos o nulos en columnas opcionales se ignoran (no se actualizan)

## Validaciones

- **Legajo**: Debe ser un número entero válido
- **Cédula**: Debe ser un texto no vacío
- **Departamento**: Debe existir en la tabla de departamentos (validación por nombre exacto)

## Recomendaciones

1. **Verificar departamentos**: Antes de cargar el archivo, asegúrate de que los nombres de departamentos coincidan exactamente con los registrados en el sistema
2. **Revisar el resumen**: Después de la carga, revisa el mensaje de confirmación para identificar registros no procesados
3. **Backup**: Se recomienda hacer un respaldo de la base de datos antes de realizar cargas masivas grandes
4. **Prueba pequeña**: Realiza una prueba con pocos registros antes de cargar archivos grandes

## Diferencias con la Carga de Computadores

A diferencia de la carga masiva de computadores:
- Los usuarios pueden ser **creados** si no existen (los computadores solo se actualizan)
- Se requieren más campos obligatorios para la creación
- La búsqueda se realiza por **legajo** en lugar de serial
- Se valida la existencia del departamento antes de asignar
