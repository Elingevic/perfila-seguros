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
      id: true, nombre: true, email: true, rol: true, activo: true, aseguradoraId: true, intermediarioId: true,
      aseguradora: { select: { id: true, nombre: true, sigla: true, color: true, estado: true, tipo: true } },
      intermediario: { select: { id: true, nombre: true, tipo: true, estado: true, numeroAutorizacion: true } },
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

/** Usuario de una empresa (aseguradora, medicina prepagada, etc.). */
export async function requerirAseguradora() {
  const user = await requerirRol("ASEGURADORA");
  if (!user.aseguradora || !user.aseguradoraId) redirect("/ingresar");
  return { ...user, aseguradoraId: user.aseguradoraId, aseguradora: user.aseguradora };
}

/** Usuario de un intermediario (corredor, agente o sociedad de corretaje). */
export async function requerirIntermediario() {
  const user = await requerirRol("INTERMEDIARIO");
  if (!user.intermediario || !user.intermediarioId) redirect("/ingresar");
  return { ...user, intermediarioId: user.intermediarioId, intermediario: user.intermediario };
}
