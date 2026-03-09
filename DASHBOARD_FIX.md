# Fix del Dashboard - Total Computers

## Problema identificado

El cálculo de `totalComputers` en el endpoint `/api/dashboard` estaba incorrecto:

```typescript
// ❌ ANTES (INCORRECTO)
const totalComputers = retiredComputers + assignedLaptopsDesktops + reservedLaptops;
```

Este cálculo solo sumaba:
- Computadores de baja
- Laptops + Desktops asignados
- Laptops en resguardo (faltaban los Desktops en resguardo)

Además, no contaba computadores en otros estados como "En reparación".

## Solución implementada

```typescript
// ✅ AHORA (CORRECTO)
const totalComputersCount = await prisma.computador.count({
  where: {
    modelo: { tipo: { in: ["Laptop", "Desktop"] } }
  }
});

const totalComputers = totalComputersCount;
```

Ahora cuenta TODOS los computadores de tipo Laptop y Desktop, independientemente de su estado:
- Asignado
- Resguardo
- De Baja
- En reparación
- Cualquier otro estado

## Verificación

Para verificar que el conteo es correcto, puedes ejecutar esta consulta en tu base de datos:

```sql
SELECT 
  COUNT(*) as total_computadores,
  estado,
  COUNT(*) as cantidad_por_estado
FROM "Computador" c
JOIN "ModeloDispositivo" m ON c."modeloId" = m.id
WHERE m.tipo IN ('Laptop', 'Desktop')
GROUP BY estado;
```

Esto te mostrará:
1. El total de computadores (Laptop + Desktop)
2. Cuántos hay en cada estado

## Impacto en el dashboard

Este cambio afecta:
1. El valor mostrado en "Total Computers"
2. Los porcentajes calculados para las gráficas circulares
3. Los porcentajes en las estadísticas por departamento
4. Los porcentajes en las estadísticas por gerencia
5. Los porcentajes en las estadísticas por sociedad

Todos estos cálculos ahora usarán el total correcto como base.

## Notas adicionales

- El conteo solo incluye computadores de tipo "Laptop" y "Desktop"
- No incluye otros tipos de dispositivos (impresoras, switches, etc.)
- El cambio es retrocompatible con el frontend existente
