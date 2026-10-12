# Plan de ShipLog

ShipLog es una aplicación sencilla para developers: registran los proyectos en los que trabajan y llevan un historial semanal de lo que van construyendo. El historial se genera automáticamente a partir de GitHub.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS + shadcn/ui y Supabase (Postgres + Auth). Despliegue en Vercel + Supabase Cloud; desarrollo local con la CLI de Supabase.

El alcance es deliberadamente pequeño; el proyecto crecerá de forma progresiva.

## MVP

Un developer entra con GitHub, crea proyectos vinculados a un repo y ShipLog llena el historial solo con sus PRs mergeados y sus commits. Lo consulta por proyecto o en "Mi semana".

### Entra en el MVP

- Login con GitHub OAuth, varios usuarios y datos privados por usuario (RLS).
- Proyectos con nombre, descripción corta, repo de GitHub vinculado (se elige de los repos del usuario) y estado activo/archivado. Se pueden crear, editar, archivar y borrar.
- Sincronización con GitHub al abrir el proyecto (como mucho una vez cada 10 minutos) y con un botón "Sincronizar".
- Registros con título, fecha, enlace al PR/commit y origen (`pr` / `commit` / `manual`).
  - Los automáticos se pueden editar u ocultar.
  - Como respaldo, el usuario puede crear, editar y borrar registros manuales.
- Vistas:
  - Historial del proyecto, agrupado por semana ISO.
  - "Mi semana", con los registros de todos los proyectos activos y navegación entre semanas.
- UI en español con Tailwind + shadcn/ui.
- Calidad: lint, typecheck y algunos tests de lo esencial.

### Fuera del MVP

- Sincronización programada.
- Tipos, etiquetas y markdown en los registros.
- Compartir o publicar cualquier contenido (en el MVP todo es privado).
- Resúmenes con IA.
- Exportación.
- Notificaciones.
- Equipos.

## Diseño técnico

### Autenticación y token de GitHub

- Supabase Auth con el proveedor GitHub, con el scope `repo` para poder leer repos privados (ver decisión 1).
- Supabase solo entrega el `provider_token` en el momento del login y no lo guarda. Se captura en `/auth/callback` y se guarda cifrado en la tabla `github_tokens`.
- El cliente no tiene acceso a `github_tokens`. Toda llamada a GitHub se hace en el servidor.
- Si el token falta o GitHub lo rechaza, se pide al usuario que vuelva a iniciar sesión.

### Sincronización con GitHub

- **Disparadores:**
  - Al abrir el proyecto, con throttle: no se sincroniza si `last_synced_at` es de hace menos de 10 minutos.
  - Con el botón "Sincronizar".
- **Primera sincronización:** se importan los últimos 30 días (decisión 3).
- **Qué se trae:**
  - PRs mergeados en la rama por defecto.
  - Commits de la rama por defecto.
  - En ambos casos, solo los que hizo el usuario (decisión 2).
- **Deduplicación:** se excluyen los commits que ya forman parte de un PR mergeado (decisión 4). Para detectarlos se usan la lista de commits de cada PR y su `merge_commit_sha`.
- **Upsert:** se hace por `(project_id, source, external_id)` sin sobrescribir lo que el usuario ya editó. `external_id` es el número del PR o el SHA del commit.
- **Borrar un registro automático equivale a ocultarlo** (decisión 6). Si se borrara de verdad, volvería a aparecer en la siguiente sincronización.
- Se muestran estados de carga y de error, y se actualiza `last_synced_at`.

### Semanas y zona horaria

- La fecha del registro se guarda en `occurred_at` (timestamptz): `merged_at` para los PRs y la fecha del commit para los commits.
- Se agrupa por semana ISO (de lunes a domingo) con la zona horaria del navegador. El servidor la recibe a través de una cookie.

## Modelo de datos

Todas las tablas tienen RLS: cada usuario solo puede ver y modificar sus propios datos.

- **`profiles`**: `id` (= `auth.users.id`), `github_login`, `avatar_url`, `created_at`. Se crea con un trigger cuando el usuario se registra.
- **`github_tokens`**: `user_id` (PK), `access_token` cifrado, `scopes`, `updated_at`. El cliente no tiene acceso; solo se usa en el servidor.
- **`projects`**: `id`, `user_id`, `name`, `description`, `status` (`active` | `archived`), `github_repo_id`, `repo_full_name`, `default_branch`, `last_synced_at`, `created_at`, `updated_at`. Un repo por proyecto (decisión 5).
- **`entries`**:
  - Campos: `id`, `project_id`, `user_id`, `source` (`pr` | `commit` | `manual`), `external_id` (nulo en los manuales), `title`, `url`, `occurred_at`, `hidden`, `created_at`, `updated_at`.
  - Restricción única sobre `(project_id, source, external_id)` cuando `external_id` no es nulo.

## Rutas

- `/`: inicio y login con GitHub.
- `/auth/callback`: callback de OAuth.
- `/semana`: "Mi semana", con navegación entre semanas.
- `/proyectos`: listado de proyectos activos y archivados.
- `/proyectos/nuevo`: alta de proyecto con selector de repo.
- `/proyectos/[id]`: historial del proyecto agrupado por semana.
- `/proyectos/[id]/editar`: edición del proyecto.

## Tareas

Cada tarea se entrega en su propio PR.

1. **Base del proyecto.** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + ESLint + Vitest, README y CI en GitHub Actions (lint, typecheck y tests).
2. **Supabase local.** Inicializar la CLI de Supabase, configurar el proveedor GitHub, crear los clientes de servidor, navegador y middleware, y añadir `.env.example`.
3. **Esquema y RLS.**
   - Migración con `profiles`, `github_tokens`, `projects` y `entries`.
   - Triggers: crear el perfil al registrarse y mantener `updated_at`.
   - Tipos generados.
   - Test pgTAP que verifique que un usuario no ve los datos de otro.
4. **Auth con GitHub.** Login, callback que guarda el token cifrado, logout, protección de rutas y manejo del token inválido.
5. **CRUD de proyectos.** Listado (activos y archivados), alta con selector de repos, edición, archivado y borrado.
6. **Sincronización con GitHub.**
   - Módulo `lib/github`: PRs, commits y deduplicación.
   - Server action de sincronización.
   - Disparo al abrir el proyecto con throttle, más el botón "Sincronizar".
   - Estados de carga y de error.
   - Tests unitarios con respuestas simuladas de GitHub.
7. **Historial por proyecto.** Registros agrupados por semana, editar título, ocultar/mostrar (con un filtro "ver ocultos") y alta/borrado de registros manuales.
8. **Mi semana.** Selector de semana, registros de todos los proyectos activos agrupados por proyecto, cookie de zona horaria y tests de las utilidades de semana ISO.
9. **Despliegue.** Proyecto en Supabase Cloud, OAuth App de producción, Vercel con sus variables de entorno, `supabase db push` y guía de despliegue en el README.

## Lo que hará Juan

- Crear el repositorio `jfor26/shiplog` y dar acceso a la GitHub App de Devin (hecho).
- Crear las OAuth Apps de GitHub, una para local y otra para producción. El callback es el de Supabase:
  - Local: `http://127.0.0.1:54321/auth/v1/callback`.
  - Producción: `https://<ref>.supabase.co/auth/v1/callback`.
- Crear el proyecto de Supabase Cloud y el de Vercel.
- Proporcionar las credenciales necesarias como secretos.

## Decisiones resueltas

1. **Repos privados:** se usa el scope `repo` de OAuth en el MVP. En las OAuth Apps no existe un permiso de solo lectura, así que este scope también da escritura. Más adelante se podrá migrar a una GitHub App con permisos de solo lectura.
2. **Autoría:** solo se importan los PRs y commits del propio usuario.
3. **Historial inicial:** al vincular el repo se importan los últimos 30 días.
4. **Commits:** solo los de la rama por defecto, excluyendo los que ya forman parte de un PR mergeado.
5. **Un repo por proyecto** en el MVP.
6. **Borrar un registro automático equivale a ocultarlo.**
