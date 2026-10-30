import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "./db";
import { leerSesion } from "./session";
import { RUTA_INICIO, type Rol } from "./dominio";

/** Usuario autenticado (o null). Se memoiza por request. */
export const usuarioActual = cache(async () => {
  const sesion = await leerSesion();
  if (!sesion) return null;
  const user = await db.user.findUnique({
    where: { id: sesion.userId },
    select: {
      id: true, nombre: true, email: true, rol: true, activo: true, aseguradoraId: true,
      aseguradora: { select: { id: true, nombre: true, sigla: true, color: true, estado: true } },
    },
  });
  if (!user || !user.activo) return null;
  return { ...user, rol: user.rol as Rol };
});

export type UsuarioActual = NonNullable<Awaited<ReturnType<typeof usuarioActual>>>;

/** Exige sesión con alguno de los roles indicados; si no, redirige. */
export async function requerirRol(...roles: Rol[]) {
  const user = await usuarioActual();
  if (!user) redirect("/ingresar");
  if (!roles.includes(user.rol)) redirect(RUTA_INICIO[user.rol]);
  return user;
}

/** Usuario de aseguradora con la aseguradora aprobada. */
export async function requerirAseguradora() {
  const user = await requerirRol("ASEGURADORA");
  if (!user.aseguradora || !user.aseguradoraId) redirect("/ingresar");
  return { ...user, aseguradoraId: user.aseguradoraId, aseguradora: user.aseguradora };
}
