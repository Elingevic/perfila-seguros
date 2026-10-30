"use server";

import { revalidatePath } from "next/cache";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_ASEGURADORA } from "@/lib/dominio";
import { notificarAseguradora, notificarIntermediario } from "@/lib/notificar";

export async function cambiarEstadoAseguradora(id: string, estado: string) {
  await requerirRol("ADMIN");
  if (!(estado in ESTADO_ASEGURADORA)) return;

  const a = await db.aseguradora.update({ where: { id }, data: { estado } });
  if (estado === "SUSPENDIDA") {
    // Una aseguradora suspendida no puede tener ofertas vigentes
    await db.oferta.updateMany({ where: { aseguradoraId: id, estado: "ENVIADA" }, data: { estado: "RETIRADA" } });
  }
  await notificarAseguradora(a.id, {
    titulo: estado === "APROBADA" ? "¡Tu empresa fue aprobada!" : `Estado actualizado: ${ESTADO_ASEGURADORA[estado as keyof typeof ESTADO_ASEGURADORA].label}`,
    mensaje: estado === "APROBADA" ? "Los intermediarios ya pueden solicitar vincularse a tu empresa." : "Contacta a soporte si tienes dudas.",
    link: estado === "APROBADA" ? "/aseguradora/intermediarios" : "/aseguradora",
  });
  revalidatePath("/admin", "layout");
}

export async function cambiarActivoUsuario(id: string, activo: boolean) {
  const admin = await requerirRol("ADMIN");
  if (id === admin.id) return; // no desactivarse a sí mismo
  await db.user.update({ where: { id }, data: { activo } });
  revalidatePath("/admin/usuarios");
}

export async function cambiarEstadoIntermediario(id: string, estado: string) {
  await requerirRol("ADMIN");
  if (!(estado in ESTADO_ASEGURADORA)) return;

  await db.intermediario.update({ where: { id }, data: { estado } });
  if (estado === "SUSPENDIDA") {
    await db.oferta.updateMany({ where: { intermediarioId: id, estado: "ENVIADA" }, data: { estado: "RETIRADA" } });
  }
  await notificarIntermediario(id, {
    titulo: estado === "APROBADA" ? "¡Tu registro fue verificado!" : `Estado actualizado: ${ESTADO_ASEGURADORA[estado as keyof typeof ESTADO_ASEGURADORA].label}`,
    mensaje: estado === "APROBADA" ? "Solicita vínculo con las empresas que representas para empezar a ofertar." : "Contacta a soporte si tienes dudas.",
    link: estado === "APROBADA" ? "/intermediario/empresas" : "/intermediario",
  });
  revalidatePath("/admin", "layout");
}
