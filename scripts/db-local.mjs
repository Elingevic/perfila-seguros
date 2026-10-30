// PostgreSQL local embebido (sin Docker ni instalación). Uso: npm run db:local
// Deja el servidor corriendo en el puerto 15432 hasta presionar Ctrl+C.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import pg from "pg";

const PUERTO = 15432;
const dir = "./.pgdata";
const servidor = new EmbeddedPostgres({
  databaseDir: dir,
  user: "postgres",
  password: "postgres",
  port: PUERTO,
  persistent: true,
  // UTF-8 como en producción (Windows usaría WIN1252 por defecto)
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
});

if (!existsSync(dir)) await servidor.initialise();
await servidor.start();

const cliente = new pg.Client({ host: "localhost", port: PUERTO, user: "postgres", password: "postgres", database: "postgres" });
await cliente.connect();
const { rowCount } = await cliente.query("SELECT 1 FROM pg_database WHERE datname = 'perfila'");
if (!rowCount) await cliente.query("CREATE DATABASE perfila ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'");
await cliente.end();

console.log(`PostgreSQL local listo: postgresql://postgres:postgres@localhost:${PUERTO}/perfila`);

const parar = async () => {
  await servidor.stop();
  process.exit(0);
};
process.on("SIGINT", parar);
process.on("SIGTERM", parar);
