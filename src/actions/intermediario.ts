"use server";

import { revalidatePath } from "next/cache";
import { requerirIntermediario } from "@/lib/dal";
import { db } from "@/lib/db";
import { RAMOS, codigoRamo, parseRamos, puedeRepresentar, usd, type TipoEmpresa, type TipoIntermediario } from "@/lib/dominio";
import { OfertaEsquema, erroresDe, type EstadoForm } from "@/lib/esquemas";
import { notificar, notificarAseguradora } from "@/lib/notificar";

async function intermediarioAprobado() {
  const user = await requerirIntermediario();
  if (user.intermediario.estado !== "APROBADA") {
    throw new Error("Tu registro como intermediario aún no está verificado.");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Ofertas
// ---------------------------------------------------------------------------
export async function enviarOferta(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const user = await intermediarioAprobado();
  const r = OfertaEsquema.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };
  const d = r.data;

  // La empresa debe estar aprobada y vinculada a este intermediario
  const vinculo = await db.vinculo.findUnique({
    where: { intermediarioId_aseguradoraId: { intermediarioId: user.intermediarioId, aseguradoraId: d.aseguradoraId } },
    include: { aseguradora: true },
  });
  if (!vinculo || vinculo.estado !== "APROBADO" || vinculo.aseguradora.estado !== "APROBADA") {
    return { errores: { aseguradoraId: ["No representas a esta empresa."] } };
  }
  const empresa = vinculo.aseguradora;
  if (!codigoRamo(d.ramo, empresa.tipo as TipoEmpresa)) {
    return { errores: { aseguradoraId: [`${empresa.nombre} no opera el ramo ${RAMOS[d.ramo].nombre}.`] } };
  }

  const solicitud = await db.solicitud.findUnique({ where: { id: d.solicitudId }, include: { perfil: true } });
  if (!solicitud || solicitud.estado !== "ABIERTA" || solicitud.expiraAt < new Date()) {
    return { mensaje: "Este perfil ya no está recibiendo ofertas." };
  }
  if (!parseRamos(solicitud.ramos).includes(d.ramo)) return { mensaje: "El usuario no busca este ramo." };

  const yaElegida = await db.oferta.findFirst({ where: { solicitudId: d.solicitudId, ramo: d.ramo, estado: "ACEPTADA" } });
  if (yaElegida) return { mensaje: "El usuario ya eligió una oferta para este ramo." };

  const clave = {
    solicitudId_intermediarioId_aseguradoraId_ramo: {
      solicitudId: d.solicitudId, intermediarioId: user.intermediarioId, aseguradoraId: empresa.id, ramo: d.ramo,
    },
  };
  const existente = await db.oferta.findUnique({ where: clave });
  if (existente && existente.estado !== "ENVIADA" && existente.estado !== "RETIRADA") {
    return { mensaje: "Ya no puedes modificar esta oferta." };
  }

  const datos = {
    primaCents: Math.round(d.primaUsd * 100),
    sumaAseguradaUsd: d.sumaAseguradaUsd,
    resumen: d.resumen,
    exclusiones: d.exclusiones,
    estado: "ENVIADA",
  };
  await db.oferta.upsert({
    where: clave,
    update: datos,
    create: { ...datos, solicitudId: d.solicitudId, intermediarioId: user.intermediarioId, aseguradoraId: empresa.id, ramo: d.ramo },
  });

  const mejora = existente?.estado === "ENVIADA";
  await notificar(solicitud.perfil.userId, {
    titulo: mejora ? "Un intermediario mejoró su oferta" : "¡Nueva oferta para ti!",
    mensaje: `${user.intermediario.nombre} te ofrece ${RAMOS[d.ramo].nombre} con ${empresa.nombre} por ${usd(datos.primaCents)}/mes.`,
    link: "/app/ofertas",
  });

  revalidatePath("/intermediario", "layout");
  return { ok: true, mensaje: mejora ? "Oferta actualizada." : "Oferta enviada. Te avisaremos si la acepta." };
}

export async function retirarOferta(ofertaId: string) {
  const user = await intermediarioAprobado();
  await db.oferta.updateMany({
    where: { id: ofertaId, intermediarioId: user.intermediarioId, estado: "ENVIADA" },
    data: { estado: "RETIRADA" },
  });
  revalidatePath("/intermediario", "layout");
}

// ---------------------------------------------------------------------------
// Vínculos con empresas
// ---------------------------------------------------------------------------
export async function solicitarVinculo(aseguradoraId: string) {
  const user = await requerirIntermediario();
  const empresa = await db.aseguradora.findFirst({ where: { id: aseguradoraId, estado: "APROBADA" } });
  if (!empresa) return;
  if (!puedeRepresentar(user.intermediario.tipo as TipoIntermediario, empresa.tipo as TipoEmpresa)) return;

  const existente = await db.vinculo.findUnique({
    where: { intermediarioId_aseguradoraId: { intermediarioId: user.intermediarioId, aseguradoraId } },
  });
  if (existente?.estado === "APROBADO" || existente?.estado === "PENDIENTE") return;

  await db.vinculo.upsert({
    where: { intermediarioId_aseguradoraId: { intermediarioId: user.intermediarioId, aseguradoraId } },
    update: { estado: "PENDIENTE" },
    create: { intermediarioId: user.intermediarioId, aseguradoraId },
  });
  await notificarAseguradora(aseguradoraId, {
    titulo: "Solicitud de vínculo",
    mensaje: `${user.intermediario.nombre} (autorización ${user.intermediario.numeroAutorizacion}) quiere ofrecer tus productos.`,
    link: "/aseguradora/intermediarios",
  });
  revalidatePath("/intermediario/empresas");
}
