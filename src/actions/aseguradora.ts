"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_SINIESTRO, PRODUCTOS, parseProductos, usd, type Producto } from "@/lib/dominio";
import { ConfigAseguradoraEsquema, OfertaEsquema, erroresDe, type EstadoForm } from "@/lib/esquemas";
import { notificar } from "@/lib/notificar";

async function aseguradoraAprobada() {
  const user = await requerirAseguradora();
  if (user.aseguradora.estado !== "APROBADA") {
    throw new Error("Tu aseguradora aún no está aprobada para operar.");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Ofertas
// ---------------------------------------------------------------------------
export async function enviarOferta(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const user = await aseguradoraAprobada();
  const r = OfertaEsquema.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };
  const d = r.data;

  const solicitud = await db.solicitud.findUnique({ where: { id: d.solicitudId }, include: { perfil: true } });
  if (!solicitud || solicitud.estado !== "ABIERTA" || solicitud.expiraAt < new Date()) {
    return { mensaje: "Este perfil ya no está recibiendo ofertas." };
  }
  if (!parseProductos(solicitud.productos).includes(d.producto)) {
    return { mensaje: "El usuario no busca esta cobertura." };
  }

  const existente = await db.oferta.findUnique({
    where: { solicitudId_aseguradoraId_producto: { solicitudId: d.solicitudId, aseguradoraId: user.aseguradoraId, producto: d.producto } },
  });
  if (existente && existente.estado !== "ENVIADA" && existente.estado !== "RETIRADA") {
    return { mensaje: "Ya no puedes modificar esta oferta." };
  }
  const yaElegida = await db.oferta.findFirst({
    where: { solicitudId: d.solicitudId, producto: d.producto, estado: "ACEPTADA" },
  });
  if (yaElegida) return { mensaje: "El usuario ya eligió una oferta para esta cobertura." };

  const datos = {
    primaCents: Math.round(d.primaUsd * 100),
    sumaAseguradaUsd: d.sumaAseguradaUsd,
    resumen: d.resumen,
    exclusiones: d.exclusiones,
    estado: "ENVIADA",
  };
  await db.oferta.upsert({
    where: { solicitudId_aseguradoraId_producto: { solicitudId: d.solicitudId, aseguradoraId: user.aseguradoraId, producto: d.producto } },
    update: datos,
    create: { ...datos, solicitudId: d.solicitudId, aseguradoraId: user.aseguradoraId, producto: d.producto },
  });

  await notificar(solicitud.perfil.userId, {
    titulo: existente?.estado === "ENVIADA" ? "Una aseguradora mejoró su oferta" : "¡Nueva oferta para ti!",
    mensaje: `${user.aseguradora.nombre} te ofrece ${PRODUCTOS[d.producto].nombre} por ${usd(datos.primaCents)}/mes.`,
    link: "/app/ofertas",
  });

  revalidatePath("/aseguradora", "layout");
  return { ok: true, mensaje: existente?.estado === "ENVIADA" ? "Oferta actualizada." : "Oferta enviada. Te avisaremos si la acepta." };
}

export async function retirarOferta(ofertaId: string) {
  const user = await aseguradoraAprobada();
  await db.oferta.updateMany({
    where: { id: ofertaId, aseguradoraId: user.aseguradoraId, estado: "ENVIADA" },
    data: { estado: "RETIRADA" },
  });
  revalidatePath("/aseguradora", "layout");
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------
function sumarMes(d: Date) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + 1);
  return r;
}

export async function verificarPago(pagoId: string, aprobar: boolean, formData: FormData) {
  const user = await aseguradoraAprobada();
  const pago = await db.pago.findFirst({
    where: { id: pagoId, estado: "EN_REVISION", poliza: { aseguradoraId: user.aseguradoraId } },
    include: { poliza: true },
  });
  if (!pago) return;

  const nota = String(formData.get("nota") ?? "").trim().slice(0, 300) || null;
  const ahora = new Date();
  const poliza = pago.poliza;
  const prod = PRODUCTOS[poliza.producto as Producto].nombre;

  if (aprobar) {
    const base = poliza.pagadaHasta && poliza.pagadaHasta > ahora ? poliza.pagadaHasta : ahora;
    await db.$transaction([
      db.pago.update({ where: { id: pago.id }, data: { estado: "APROBADO", revisadoAt: ahora, nota } }),
      db.poliza.update({
        where: { id: poliza.id },
        data: { estado: "ACTIVA", inicio: poliza.inicio ?? ahora, pagadaHasta: sumarMes(base) },
      }),
    ]);
    await notificar(poliza.userId, {
      titulo: poliza.estado === "PENDIENTE_PAGO" ? "¡Tu póliza está activa! 🎉" : "Pago confirmado",
      mensaje: `${user.aseguradora.nombre} confirmó tu pago de ${usd(pago.montoCents)}. ${prod} cubierto por un mes más.`,
      link: `/app/polizas/${poliza.id}`,
    });
  } else {
    await db.pago.update({
      where: { id: pago.id },
      data: { estado: "RECHAZADO", revisadoAt: ahora, nota: nota ?? "No se pudo verificar el pago." },
    });
    await notificar(poliza.userId, {
      titulo: "No pudimos verificar tu pago",
      mensaje: `${user.aseguradora.nombre}: ${nota ?? "revisa la referencia y vuelve a reportarlo."}`,
      link: `/app/polizas/${poliza.id}`,
    });
  }
  revalidatePath("/aseguradora", "layout");
}

// ---------------------------------------------------------------------------
// Siniestros
// ---------------------------------------------------------------------------
const ActualizarSiniestro = z.object({
  estado: z.enum(Object.keys(ESTADO_SINIESTRO) as [keyof typeof ESTADO_SINIESTRO]),
  respuesta: z.string().trim().max(1000).optional(),
});

export async function actualizarSiniestro(siniestroId: string, formData: FormData) {
  const user = await aseguradoraAprobada();
  const r = ActualizarSiniestro.safeParse(Object.fromEntries(formData));
  if (!r.success) return;

  const s = await db.siniestro.findFirst({
    where: { id: siniestroId, poliza: { aseguradoraId: user.aseguradoraId } },
    include: { poliza: true },
  });
  if (!s) return;

  await db.siniestro.update({
    where: { id: s.id },
    data: { estado: r.data.estado, respuesta: r.data.respuesta || s.respuesta },
  });
  await notificar(s.poliza.userId, {
    titulo: "Actualización de tu siniestro",
    mensaje: `Estado: ${ESTADO_SINIESTRO[r.data.estado].label}.${r.data.respuesta ? " " + r.data.respuesta : ""}`,
    link: `/app/polizas/${s.polizaId}`,
  });
  revalidatePath("/aseguradora/siniestros");
}

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
export async function guardarConfiguracion(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const user = await requerirAseguradora();
  const r = ConfigAseguradoraEsquema.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };
  await db.aseguradora.update({ where: { id: user.aseguradoraId }, data: r.data });
  revalidatePath("/aseguradora", "layout");
  return { ok: true, mensaje: "Cambios guardados." };
}
