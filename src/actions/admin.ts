"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_ASEGURADORA } from "@/lib/dominio";
import { notificarAseguradora } from "@/lib/notificar";

export async function cambiarEstadoAseguradora(id: string, estado: string) {
  await requerirRol("ADMIN");
  if (!(estado in ESTADO_ASEGURADORA)) return;

  const a = await db.aseguradora.update({ where: { id }, data: { estado } });
  if (estado === "SUSPENDIDA") {
    // Una aseguradora suspendida no puede tener ofertas vigentes
    await db.oferta.updateMany({ where: { aseguradoraId: id, estado: "ENVIADA" }, data: { estado: "RETIRADA" } });
  }
  await notificarAseguradora(a.id, {
    titulo: estado === "APROBADA" ? "¡Tu aseguradora fue aprobada!" : `Estado actualizado: ${ESTADO_ASEGURADORA[estado as keyof typeof ESTADO_ASEGURADORA].label}`,
    mensaje: estado === "APROBADA" ? "Ya puedes ver perfiles y enviar ofertas." : "Contacta a soporte si tienes dudas.",
    link: estado === "APROBADA" ? "/aseguradora/perfiles" : "/aseguradora",
  });
  revalidatePath("/admin", "layout");
}

export async function cambiarActivoUsuario(id: string, activo: boolean) {
  const admin = await requerirRol("ADMIN");
  if (id === admin.id) return; // no desactivarse a sí mismo
  await db.user.update({ where: { id }, data: { activo } });
  revalidatePath("/admin/usuarios");
}
