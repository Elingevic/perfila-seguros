# Perfila

> Publica tu perfil. Las aseguradoras compiten por ti.

Marketplace de seguros para jóvenes en Venezuela que no tienen seguro por medio de su empresa. La persona crea un perfil asegurador anónimo y las aseguradoras autorizadas le envían ofertas. La persona compara, contrata, paga (Pago Móvil, transferencia o tarjeta) y reporta siniestros, todo desde la plataforma.

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL · Zod · sesiones JWT firmadas (jose) · Playwright.

## Ejecutar en local

```bash
npm install
cp .env.example .env          # completa DATABASE_URL (PostgreSQL) y SESSION_SECRET
npm run db:deploy             # aplica las migraciones
npm run db:seed               # carga datos de demostración (BORRA la base)
npm run dev                   # http://localhost:3000
```

### Cuentas demo (contraseña `Perfila2026`)

| Rol | Correo | Qué muestra |
|---|---|---|
| Persona | `luis@demo.perfila.app` | Perfil publicado con ofertas por elegir |
| Persona | `maria@demo.perfila.app` | Póliza de vida activa |
| Aseguradora | `tepuy@demo.perfila.app` | Pago por verificar, perfiles para ofertar |
| Aseguradora pendiente | `caribe@demo.perfila.app` | Cuenta en verificación |
| Admin | `admin@demo.perfila.app` | Aprobación de aseguradoras, indicadores |

Todas las aseguradoras de la demo son **ficticias**.

## Funcionalidades

**Persona** (`/app`)
- Registro y asistente de perfil de 7 pasos, con coberturas recomendadas y prima estimada.
- Publicación del perfil (solicitud abierta 7 días). Es anónimo para las aseguradoras.
- Comparación de ofertas por cobertura: precio, suma asegurada, % de reclamos pagados, días de pago, qué cubre y qué no.
- Aceptación de la oferta → emisión de la póliza → reporte de pago → activación.
- Reporte de siniestros y seguimiento.
- Notificaciones de nuevas ofertas, pagos confirmados y estado de siniestros.

**Aseguradora** (`/aseguradora`)
- Registro de la empresa (queda pendiente hasta que un admin la aprueba).
- Mercado de perfiles anónimos con filtros por cobertura, ocupación y estado, y precio de referencia sugerido.
- Envío y mejora de ofertas, y retiro de ofertas.
- Verificación de pagos (confirmar o rechazar), cartera de pólizas con datos de contacto (solo tras la aceptación).
- Gestión de siniestros y configuración (marca, indicadores públicos, datos de cobro).

**Admin** (`/admin`)
- Indicadores de impacto (personas aseguradas, conversión, primas).
- Aprobación o suspensión de aseguradoras y activación o desactivación de usuarios.

## Seguridad

- Contraseñas con bcrypt y sesión en una cookie `httpOnly`, `sameSite=lax` y `secure` en producción, firmada con HS256 y válida 7 días.
- Autorización en cada página y en cada server action (`src/lib/dal.ts`). `src/proxy.ts` solo hace redirecciones optimistas.
- Validación de toda entrada con Zod (`src/lib/esquemas.ts`).
- Anonimato: las consultas del mercado nunca seleccionan nombre ni contacto, y la autodeclaración de salud no se muestra a las aseguradoras.
- Cabeceras de seguridad (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- Protección contra *open redirect* en el login y referencias de pago duplicadas bloqueadas.

## Pruebas

```bash
npm run typecheck
npm run lint
npm run build && npx playwright test   # flujo completo de punta a punta
```

La prueba `e2e/flujo-completo.spec.ts` recorre el ciclo completo: registro → perfil → oferta → aceptación → pago → activación → siniestro → respuesta, más el control de acceso entre roles, la aprobación de aseguradoras por el admin y el error de credenciales. Necesita la base con datos demo.

## Despliegue en Vercel

1. En Vercel: **Add New → Project**, importa el repositorio `perfila-seguros`.
2. En **Storage**, crea una base **Neon (Postgres)** y conéctala al proyecto. Eso crea `DATABASE_URL` automáticamente.
3. En **Settings → Environment Variables**, agrega:
   - `SESSION_SECRET`: 32 o más caracteres aleatorios.
   - `SEED_DEMO` = `1`, solo si quieres las cuentas demo. Se cargan una sola vez, cuando la base está vacía.
4. Haz **Deploy**. El script `vercel-build` aplica las migraciones, carga la demo (si corresponde) y compila.

> ⚠️ Las cuentas demo tienen una contraseña pública. Para uso real, no actives `SEED_DEMO`, o cambia y desactiva esas cuentas después.

## Estructura

```
src/
  actions/      server actions por rol (auth, persona, aseguradora, admin)
  app/          rutas: landing, (auth), app/, aseguradora/, admin/, notificaciones
  components/   UI compartida (ui.tsx, shell, formularios)
  lib/          db, sesión, control de acceso (dal), dominio (catálogos y reglas), esquemas Zod
  proxy.ts      protección optimista de rutas
prisma/         esquema, migraciones y seed
e2e/            pruebas Playwright
```
