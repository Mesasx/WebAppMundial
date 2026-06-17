# 🚀 Desplegar en Vercel

La app usa **Next.js 14 + Prisma/PostgreSQL**. En Vercel el sistema de ficheros es efímero,
así que **no** se puede usar SQLite: necesitas un Postgres gestionado. La guía usa
**Vercel Postgres (Neon)**, que se integra en un clic.

## 1. Sube el repo a GitHub
Ya está. Importa el repositorio en Vercel: <https://vercel.com/new> → elige `WebAppMundial`.
Vercel detecta Next.js automáticamente (no cambies el framework preset).

## 2. Crea la base de datos (Vercel Postgres / Neon)
En el proyecto de Vercel → pestaña **Storage** → **Create Database** → **Postgres** →
elige una región y créala. Al conectarla al proyecto, Vercel añade automáticamente varias
variables de entorno, entre ellas:

- `POSTGRES_PRISMA_URL`  → conexión *pooled* (PgBouncer)
- `POSTGRES_URL_NON_POOLING` → conexión *directa*

## 3. Configura las variables de entorno
En **Settings → Environment Variables** del proyecto, añade (para Production y Preview):

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | el valor de **`POSTGRES_PRISMA_URL`** |
| `DIRECT_URL`   | el valor de **`POSTGRES_URL_NON_POOLING`** |
| `AUTH_SECRET`  | una cadena larga y aleatoria (`openssl rand -base64 32`) |

> El esquema de Prisma lee `DATABASE_URL` (runtime) y `DIRECT_URL` (para crear tablas).

## 4. Despliega
Pulsa **Deploy**. El build ejecuta:

```
prisma generate && prisma db push && next build
```

`prisma db push` crea las tablas en tu Postgres en el primer deploy (es idempotente, no borra
datos en cambios aditivos). Cuando termine, abre la URL `*.vercel.app`. ✅

## 5. (Opcional) Cuenta demo en producción
`npm run db:seed` crea `demo@mundial.com / demo1234`. Para ejecutarlo contra la base de datos
de producción, desde tu máquina con las env vars de prod:

```bash
DATABASE_URL="<POSTGRES_URL_NON_POOLING>" DIRECT_URL="<POSTGRES_URL_NON_POOLING>" npm run db:seed
```

O simplemente regístrate con tu propia cuenta desde la web.

---

## Notas
- **Migraciones**: el proyecto usa `prisma db push` (sin carpeta de migraciones) por
  simplicidad. Si prefieres migraciones versionadas, cambia el build a
  `prisma migrate deploy` y genera migraciones con `prisma migrate dev` en local.
- **Otro proveedor** (Neon directo, Supabase): igual de válido. Copia su *connection string*
  pooled a `DATABASE_URL` y la directa a `DIRECT_URL`. En Supabase usa el puerto del pooler
  (6543) para `DATABASE_URL` y el directo (5432) para `DIRECT_URL`.
- **Región**: pon la base de datos en la misma región que las funciones de Vercel para menor
  latencia.
