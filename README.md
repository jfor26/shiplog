# ShipLog

Aplicación para developers: registra los proyectos en los que trabajas y lleva un historial semanal de lo que construyes, generado a partir de tus PRs y commits de GitHub.

El plan del MVP y las tareas están en [`plan.md`](./plan.md).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (Base UI)
- Supabase (Postgres + Auth), pendiente de las tareas 2 a 4
- ESLint y Vitest + Testing Library

## Requisitos

- Node.js 24 (ver `.nvmrc`)
- npm

## Desarrollo

```bash
npm install
npm run dev
```

La app queda en http://localhost:3000.

## Scripts

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Genera los tipos de rutas de Next.js y ejecuta `tsc --noEmit` |
| `npm test` | Tests con Vitest (una sola ejecución) |
| `npm run test:watch` | Tests en modo watch |

Para añadir componentes de shadcn/ui: `npx shadcn@latest add <componente>`.

## CI

GitHub Actions ejecuta lint, typecheck y tests en cada PR y en cada push a `main` (`.github/workflows/ci.yml`).

## Estructura

```
src/
  app/            Rutas (App Router), layout y estilos globales
  components/ui/  Componentes de shadcn/ui
  lib/            Utilidades compartidas
```
