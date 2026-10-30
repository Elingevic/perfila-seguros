// Ejecuta un comando apuntando a la base de datos activa.
// En Vercel la base actual está conectada con el prefijo V2_ (V2_DATABASE_URL);
// si existe, tiene prioridad sobre DATABASE_URL.
// Uso: node scripts/con-base.mjs <comando> [args...]
import { spawnSync } from "node:child_process";

for (const nombre of ["DATABASE_URL", "DATABASE_URL_UNPOOLED"]) {
  const v2 = process.env[`V2_${nombre}`];
  if (v2) process.env[nombre] = v2;
}

const [comando, ...args] = process.argv.slice(2);
const r = spawnSync(comando, args, { stdio: "inherit", shell: true, env: process.env });
process.exit(r.status ?? 1);
