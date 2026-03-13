# AGENTS.md - ventoryV2

## Project Overview

**ventoryV2** es un sistema de gestión de inventario de equipos tecnológicos (computadoras, dispositivos, líneas telefónicas) para empresas.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Radix UI, Tailwind CSS, shadcn/ui
- **Backend**: Next.js App Router, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT (jose) + bcrypt
- **State**: TanStack Query, React Hook Form

## Estructura del Proyecto

```
src/
├── app/                    # Next.js App Router
├── components/
│   └── ui/               # Componentes base (Radix + Tailwind)
├── hooks/                 # Custom hooks (useSession, useIsAdmin)
├── lib/                   # Utilidades, auth, prisma client
├── types/                 # Tipos TypeScript
└── utils/                 # Funciones utilitarias
```

## Convenciones de Código

### Componentes

- Usar TypeScript strict para props y estados
- Variantes con `cva` (class-variance-authority)
- Usar `cn()` para combinar clases Tailwind
- Componentes pequeños y reutilizables

### Base de Datos (Prisma)

- Schema en `prisma/schema.prisma`
- Modelos: PascalCase, campos: camelCase
- Relaciones con `@relation`
- Siempre crear migraciones para cambios

### Autenticación

- JWT con expiración de 7 días
- Roles: `user` | `admin`
- Contraseñas con bcrypt

## Comandos Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Producción
npm run lint         # Linting
npx prisma migrate dev  # Crear migración
```

## Artefactos del Proyecto

| Archivo | Descripción |
|---------|-------------|
| `prisma/schema.prisma` | Modelos de base de datos |
| `src/lib/auth.ts` | Funciones JWT |
| `src/lib/prisma.ts` | Cliente Prisma |
| `.atl/skill-registry.md` | Registro de skills |
