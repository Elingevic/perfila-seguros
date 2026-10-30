# Perfila

> Publica tu perfil. Los corredores compiten por ti.

Plataforma de seguros para jóvenes en Venezuela que no tienen seguro por medio de su empresa. La persona crea un perfil asegurador anónimo y los **intermediarios autorizados** (corredores, agentes y sociedades de corretaje) le envían ofertas **respaldadas por las empresas que representan**. La persona compara, contrata, paga (Pago Móvil, transferencia o tarjeta), pide claves de emergencia de medicina prepagada y reporta siniestros, todo desde la plataforma.

**Stack:** Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL · Zod · sesiones JWT firmadas (jose) · Playwright.

## Ejecutar en local

```bash
npm install
npm run db:local              # PostgreSQL embebido en el puerto 15432 (déjalo corriendo en otra terminal)
cp .env.example .env          # apunta DATABASE_URL y DATABASE_URL_UNPOOLED a la base local y completa SESSION_SECRET
npm run db:deploy             # aplica las migraciones
npm run db:seed               # carga datos de demostración (BORRA la base)
npm run dev                   # http://localhost:3000
```

Base local: `postgresql://postgres:postgres@localhost:15432/perfila`.

### Cuentas demo (contraseña `Perfila2026`)

| Rol | Correo | Qué muestra |
|---|---|---|
| Persona | `luis@demo.perfila.app` | Perfil publicado con ofertas por elegir |
| Persona | `maria@demo.perfila.app` | Medicina prepagada activa: puede pedir clave de emergencia |
| Intermediario | `corretaje@demo.perfila.app` | Sociedad de corretaje vinculada a 4 empresas |
| Intermediario | `ana@demo.perfila.app` | Corredora de seguros |
| Intermediario | `pedro@demo.perfila.app` | Agente de medicina prepagada |
| Intermediario pendiente | `brito@demo.perfila.app` | Autorización en verificación |
| Empresa de seguros | `tepuy@demo.perfila.app` | Pago por verificar, vínculo de intermediario por aprobar |
| Empresa de medicina prepagada | `saludcaribe@demo.perfila.app` | Claves de emergencia |
| Empresa pendiente | `orinoco@demo.perfila.app` | Cuenta en verificación |
| Admin | `admin@demo.perfila.app` | Verificación de empresas e intermediarios, indicadores |

Todas las empresas e intermediarios de la demo son **ficticios**.

## Catálogos oficiales

`src/lib/dominio.ts` replica, como datos fijos, los catálogos de la SUDEASEG:

- **Ramos contables** (`accounting_coverage`), con el código con que opera cada tipo de empresa.
- **Sujetos regulados** (`regulated_subject_type`): tipos de empresa e intermediario.
- **Bancos** (`bank`), **parentescos** (`relationship`) y **formas de pago** (`payment_type`).

La app no consulta la API en tiempo de ejecución.

## Funcionalidades

**Persona** (`/app`)
- Asistente de perfil de 7 pasos, con ramos recomendados agrupados (Personas, Vehículos, Patrimonio) y prima estimada.
- Publicación del perfil (solicitud abierta 7 días). Es anónimo para los intermediarios.
- Ofertas por ramo: quién propone (intermediario y su autorización), quién respalda (empresa y código de ramo), precio, suma, % de reclamos pagados y días de pago.
- Aceptación → emisión de la póliza → reporte de pago → activación.
- **Clave de emergencia** (modal): solo con medicina prepagada activa y al día. Se emite al instante, vale 24 h y la empresa la recibe en tiempo real.
- Reporte de siniestros y notificaciones.

**Intermediario** (`/intermediario`)
- Registro con tipo, documento y número de autorización (pendiente hasta que el admin lo verifica).
- Solicitud de vínculo con empresas compatibles con su tipo; la empresa lo aprueba.
- Mercado de perfiles anónimos y ofertas por ramo, eligiendo la empresa que respalda (solo empresas vinculadas que operan ese ramo).
- Mis ofertas, cartera de pólizas colocadas con datos de contacto del cliente.

**Empresa** (`/aseguradora`)
- Registro por tipo (seguros, medicina prepagada, administradora de riesgos, cooperativa).
- Aprobación o revocación de intermediarios.
- Verificación de pagos, gestión de siniestros y de claves de emergencia (marcar utilizada o anular).
- Configuración: ramos autorizados con su código, indicadores públicos y datos de cobro.

**Admin** (`/admin`)
- Indicadores de impacto, verificación de empresas e intermediarios y gestión de usuarios.

## Seguridad

- Contraseñas con bcrypt y sesión en una cookie `httpOnly`, `sameSite=lax` y `secure` en producción, firmada con HS256 y válida 7 días.
- Autorización en cada página y en cada server action (`src/lib/dal.ts`). `src/proxy.ts` solo hace redirecciones optimistas.
- Un intermediario solo puede ofertar con empresas que aprobaron su vínculo y en ramos que esa empresa opera.
- Validación de toda entrada con Zod (`src/lib/esquemas.ts`).
- Anonimato: el mercado nunca selecciona nombre ni contacto, y la autodeclaración de salud no se muestra.
- Cabeceras de seguridad, protección contra *open redirect* y referencias de pago duplicadas bloqueadas.

## Pruebas

```bash
npm run typecheck
npm run lint
npm run build && npx playwright test   # flujo completo de punta a punta
```

`e2e/flujo-completo.spec.ts` recorre: registro → perfil → oferta del intermediario con respaldo de una empresa → aceptación → pago → activación → clave de emergencia → gestión de la clave → siniestro, más el control de acceso entre roles, la aprobación de vínculos y la verificación de intermediarios. Necesita la base con datos demo.

## Despliegue en Vercel

1. Importa el repositorio en Vercel y conecta una base **Neon** desde **Storage** (crea `DATABASE_URL` y `DATABASE_URL_UNPOOLED`).
2. Agrega `SESSION_SECRET` (32+ caracteres) y, solo para demos, `SEED_DEMO=1`.
3. Cada push a `main` despliega. El script `vercel-build` aplica migraciones, carga la demo si la base está vacía y compila.

> ⚠️ Las cuentas demo tienen una contraseña pública. Para uso real, no actives `SEED_DEMO`, o cambia y desactiva esas cuentas después.

## Estructura

```
src/
  actions/      server actions por rol (auth, persona, intermediario, aseguradora, admin)
  app/          rutas: landing, (auth), app/, intermediario/, aseguradora/, admin/, notificaciones
  components/   UI compartida (ui.tsx, shell, modal de clave de emergencia)
  lib/          db, sesión, control de acceso (dal), dominio (catálogos y reglas), esquemas Zod
  proxy.ts      protección optimista de rutas
prisma/         esquema, migraciones y seed
scripts/        base PostgreSQL local embebida
e2e/            pruebas Playwright
```
