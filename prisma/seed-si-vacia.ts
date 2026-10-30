// Usado en el build de Vercel: si SEED_DEMO=1 y la base no tiene usuarios,
// carga los datos de demostración. Nunca toca una base con datos.
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

async function main() {
  if (process.env.SEED_DEMO !== "1") {
    console.log("SEED_DEMO no activo: no se cargan datos demo.");
    return;
  }
  const db = new PrismaClient();
  const usuarios = await db.user.count();
  await db.$disconnect();
  if (usuarios > 0) {
    console.log(`La base ya tiene ${usuarios} usuarios: no se cargan datos demo.`);
    return;
  }
  console.log("Base vacía: cargando datos demo…");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: { ...process.env, SEED_FORCE: "1" } });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
