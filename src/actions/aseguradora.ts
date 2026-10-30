"use server";

import { revalidatePath } from "next/cache";
import * as z from "zod";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_SINIESTRO, RAMOS, usd, type Ramo } from "@/lib/dominio";
import { ConfigAseguradoraEsquema, erroresDe, type EstadoForm } from "@/lib/esquemas";
import { notificar, notificarIntermediario } from "@/lib/notificar";

async function aseguradoraAprobada() {
  const user = await requerirAseguradora();
  if (user.aseguradora.estado !== "APROBADA") {
    throw new Error("Tu empresa aún no está aprobada para operar.");
  }
  return user;
}

// ---------------------------------------------------------------------------
// Intermediarios
// ---------------------------------------------------------------------------
export async function gestionarVinculo(vinculoId: string, aprobar: boolean) {
  const user = await aseguradoraAprobada();
  const v = await db.vinculo.findFirst({ where: { id: vinculoId, aseguradoraId: user.aseguradoraId } });
  if (!v) return;

  await db.vinculo.update({ where: { id: v.id }, data: { estado: aprobar ? "APROBADO" : "RECHAZADO" } });
  if (!aprobar) {
    // Sin vínculo no puede mantener ofertas vigentes con esta empresa
    await db.oferta.updateMany({
      where: { intermediarioId: v.intermediarioId, aseguradoraId: user.aseguradoraId, estado: "ENVIADA" },
      data: { estado: "RETIRADA" },
    });
  }
  await notificarIntermediario(v.intermediarioId, {
    titulo: aprobar ? `${user.aseguradora.nombre} aprobó tu vínculo` : `${user.aseguradora.nombre} rechazó tu vínculo`,
    mensaje: aprobar ? "Ya puedes ofrecer sus productos a los perfiles publicados." : "Contacta a la empresa si crees que es un error.",
    link: "/intermediario/empresas",
  });
  revalidatePath("/aseguradora/intermediarios");
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
  const ramo = RAMOS[poliza.ramo as Ramo].nombre;

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
      mensaje: `${user.aseguradora.nombre} confirmó tu pago de ${usd(pago.montoCents)}. ${ramo} cubierto por un mes más.`,
      link: `/app/polizas/${poliza.id}`,
    });
    if (poliza.estado === "PENDIENTE_PAGO") {
      await notificarIntermediario(poliza.intermediarioId, {
        titulo: "Póliza activada",
        mensaje: `La póliza ${poliza.numero} (${ramo}) quedó activa tras confirmarse el primer pago.`,
        link: "/intermediario/cartera",
      });
    }
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
// Claves de emergencia
// ---------------------------------------------------------------------------
export async function actualizarClave(claveId: string, estado: "UTILIZADA" | "ANULADA") {
  const user = await aseguradoraAprobada();
  const c = await db.claveEmergencia.findFirst({
    where: { id: claveId, estado: "EMITIDA", poliza: { aseguradoraId: user.aseguradoraId } },
    include: { poliza: true },
  });
  if (!c) return;

  await db.claveEmergencia.update({ where: { id: c.id }, data: { estado } });
  if (estado === "ANULADA") {
    await notificar(c.poliza.userId, {
      titulo: "Clave de emergencia anulada",
      mensaje: `${user.aseguradora.nombre} anuló la clave ${c.codigo}. Comunícate con su central de emergencias.`,
      link: `/app/polizas/${c.polizaId}`,
    });
  }
  revalidatePath("/aseguradora/claves");
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
