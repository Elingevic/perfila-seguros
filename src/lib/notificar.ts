import "server-only";
import { db } from "./db";

type Aviso = { titulo: string; mensaje: string; link?: string };

export async function notificar(userId: string, aviso: Aviso) {
  await db.notificacion.create({ data: { userId, ...aviso } });
}

/** Notifica a todos los usuarios activos de una aseguradora. */
export async function notificarAseguradora(aseguradoraId: string, aviso: Aviso) {
  const usuarios = await db.user.findMany({ where: { aseguradoraId, activo: true }, select: { id: true } });
  if (usuarios.length) {
    await db.notificacion.createMany({ data: usuarios.map((u) => ({ userId: u.id, ...aviso })) });
  }
}
