"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  DIAS_SOLICITUD_ABIERTA, HORAS_VIGENCIA_CLAVE, RAMOS, RAMOS_CON_CLAVE, diaInput, diaVE, edadDesde, fechaHora, parseRamos, sinVencimiento, usd,
  vencida, type Ramo,
} from "@/lib/dominio";
import { ClaveEsquema, PagoEsquema, PerfilEsquema, SiniestroEsquema, erroresDe, type EstadoForm } from "@/lib/esquemas";
import { notificar, notificarAseguradora, notificarIntermediario } from "@/lib/notificar";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codigo = (n: number) => Array.from({ length: n }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");

async function codigoPerfilUnico() {
  for (;;) {
    const c = codigo(5);
    if (!(await db.perfil.findUnique({ where: { codigo: c } }))) return c;
  }
}

function enDias(dias: number) {
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Perfil y solicitud
// ---------------------------------------------------------------------------
export type DatosAsistente = {
  fechaNacimiento: string;
  estadoResidencia: string;
  ocupacion: string;
  vehiculo: string;
  dependientes: number;
  salud: string;
  presupuestoUsd: number;
  ramos: string[];
};

/** Guarda el perfil y lo publica: abre (o actualiza) la solicitud de ofertas. */
export async function guardarYPublicarPerfil(datos: DatosAsistente): Promise<EstadoForm> {
  const user = await requerirRol("PERSONA");
  const r = PerfilEsquema.safeParse(datos);
  if (!r.success) return { errores: erroresDe(r.error), mensaje: "Revisa los datos del perfil." };
  const { ramos, ...perfil } = r.data;

  const edad = edadDesde(perfil.fechaNacimiento);
  if (edad < 18) return { errores: { fechaNacimiento: ["Debes ser mayor de 18 años."] } };
  if (edad > 75) return { errores: { fechaNacimiento: ["Por ahora atendemos personas hasta 75 años."] } };

  const guardado = await db.perfil.upsert({
    where: { userId: user.id },
    update: perfil,
    create: { ...perfil, userId: user.id, codigo: await codigoPerfilUnico() },
  });

  const abierta = await db.solicitud.findFirst({
    where: { perfilId: guardado.id, estado: "ABIERTA" },
    include: { ofertas: { where: { estado: "ACEPTADA" }, select: { ramo: true } } },
  });

  if (abierta) {
    // Mantiene las coberturas ya contratadas en esta solicitud
    const aceptados = abierta.ofertas.map((o) => o.ramo);
    const lista = Array.from(new Set([...ramos, ...aceptados]));
    await db.solicitud.update({
      where: { id: abierta.id },
      data: {
        ramos: lista.join(","),
        expiraAt: sinVencimiento(abierta.expiraAt) ? abierta.expiraAt : enDias(DIAS_SOLICITUD_ABIERTA),
      },
    });
  } else {
    await db.solicitud.create({
      data: { perfilId: guardado.id, ramos: ramos.join(","), expiraAt: enDias(DIAS_SOLICITUD_ABIERTA) },
    });
  }

  revalidatePath("/app", "layout");
  redirect("/app/ofertas?publicado=1");
}

export async function cerrarSolicitud(solicitudId: string) {
  const user = await requerirRol("PERSONA");
  await db.solicitud.updateMany({
    where: { id: solicitudId, estado: "ABIERTA", perfil: { userId: user.id } },
    data: { estado: "CERRADA" },
  });
  revalidatePath("/app", "layout");
}

// ---------------------------------------------------------------------------
// Ofertas
// ---------------------------------------------------------------------------
export async function aceptarOferta(ofertaId: string): Promise<{ error?: string }> {
  const user = await requerirRol("PERSONA");

  const oferta = await db.oferta.findFirst({
    where: { id: ofertaId, solicitud: { perfil: { userId: user.id } } },
    include: { solicitud: true, aseguradora: true, intermediario: true },
  });
  if (!oferta) return { error: "Oferta no encontrada." };
  if (oferta.estado !== "ENVIADA") return { error: "Esta oferta ya no está disponible." };
  if (oferta.solicitud.estado !== "ABIERTA") return { error: "Esta solicitud ya está cerrada." };
  if (oferta.aseguradora.estado !== "APROBADA") return { error: "La empresa no está disponible." };
  if (oferta.intermediario.estado !== "APROBADA") return { error: "El intermediario no está disponible." };

  const poliza = await db.$transaction(async (tx) => {
    const yaAceptada = await tx.oferta.findFirst({
      where: { solicitudId: oferta.solicitudId, ramo: oferta.ramo, estado: "ACEPTADA" },
    });
    if (yaAceptada) throw new Error("Ya elegiste una oferta para esta cobertura.");

    await tx.oferta.update({ where: { id: oferta.id }, data: { estado: "ACEPTADA" } });
    await tx.oferta.updateMany({
      where: { solicitudId: oferta.solicitudId, ramo: oferta.ramo, estado: "ENVIADA", id: { not: oferta.id } },
      data: { estado: "RECHAZADA" },
    });

    // Si ya eligió oferta para todas las coberturas, la solicitud se cierra
    const ramos = parseRamos(oferta.solicitud.ramos);
    const aceptadas = await tx.oferta.findMany({
      where: { solicitudId: oferta.solicitudId, estado: "ACEPTADA" },
      select: { ramo: true },
    });
    if (ramos.every((p) => aceptadas.some((a) => a.ramo === p))) {
      await tx.solicitud.update({ where: { id: oferta.solicitudId }, data: { estado: "CERRADA" } });
    }

    return tx.poliza.create({
      data: {
        numero: `PF-${new Date().getFullYear()}-${codigo(6)}`,
        ofertaId: oferta.id,
        userId: user.id,
        aseguradoraId: oferta.aseguradoraId,
        intermediarioId: oferta.intermediarioId,
        ramo: oferta.ramo,
        primaCents: oferta.primaCents,
        sumaAseguradaUsd: oferta.sumaAseguradaUsd,
      },
    });
  }).catch((e: Error) => e);

  if (poliza instanceof Error) return { error: poliza.message };

  const ramo = RAMOS[oferta.ramo as Ramo].nombre;
  await notificarIntermediario(oferta.intermediarioId, {
    titulo: "¡Oferta aceptada!",
    mensaje: `Un usuario aceptó tu oferta de ${ramo} con ${oferta.aseguradora.nombre} por ${usd(oferta.primaCents)}/mes. Póliza ${poliza.numero}.`,
    link: "/intermediario/cartera",
  });
  await notificarAseguradora(oferta.aseguradoraId, {
    titulo: "Nueva póliza emitida",
    mensaje: `${oferta.intermediario.nombre} colocó una póliza de ${ramo} por ${usd(oferta.primaCents)}/mes. Póliza ${poliza.numero}.`,
    link: "/aseguradora/polizas",
  });

  revalidatePath("/app", "layout");
  redirect(`/app/polizas/${poliza.id}?nueva=1`);
}

// ---------------------------------------------------------------------------
// Pagos y siniestros
// ---------------------------------------------------------------------------
export async function reportarPago(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const user = await requerirRol("PERSONA");
  const r = PagoEsquema.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };

  const poliza = await db.poliza.findFirst({ where: { id: r.data.polizaId, userId: user.id } });
  if (!poliza) return { mensaje: "Póliza no encontrada." };
  if (poliza.estado === "CANCELADA") return { mensaje: "La póliza está cancelada." };
  if (diaInput(r.data.fechaPago) > diaVE()) return { errores: { fechaPago: ["La fecha no puede ser futura."] } };

  const enRevision = await db.pago.count({ where: { polizaId: poliza.id, estado: "EN_REVISION" } });
  if (enRevision) return { mensaje: "Ya tienes un pago en revisión para esta póliza. Espera la confirmación." };

  const duplicado = await db.pago.findFirst({
    where: { referencia: r.data.referencia, banco: r.data.banco, estado: { not: "RECHAZADO" } },
  });
  if (duplicado) return { errores: { referencia: ["Esta referencia ya fue registrada."] } };

  await db.pago.create({
    data: {
      polizaId: poliza.id,
      montoCents: poliza.primaCents,
      metodo: r.data.metodo,
      banco: r.data.banco,
      referencia: r.data.referencia,
      fechaPago: r.data.fechaPago,
    },
  });

  await notificarAseguradora(poliza.aseguradoraId, {
    titulo: "Pago por verificar",
    mensaje: `Póliza ${poliza.numero}: pago de ${usd(poliza.primaCents)} (ref. ${r.data.referencia}).`,
    link: "/aseguradora/polizas?tab=pagos",
  });

  revalidatePath(`/app/polizas/${poliza.id}`);
  return { ok: true, mensaje: "¡Listo! Registramos tu pago. La aseguradora lo verificará en menos de 24 horas." };
}

export async function reportarSiniestro(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const user = await requerirRol("PERSONA");
  const r = SiniestroEsquema.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };

  const poliza = await db.poliza.findFirst({ where: { id: r.data.polizaId, userId: user.id } });
  if (!poliza) return { mensaje: "Póliza no encontrada." };
  if (poliza.estado !== "ACTIVA") return { mensaje: "Solo puedes reportar siniestros en pólizas activas." };
  if (diaInput(r.data.fechaOcurrencia) > diaVE()) return { errores: { fechaOcurrencia: ["La fecha no puede ser futura."] } };
  if (poliza.inicio && diaInput(r.data.fechaOcurrencia) < diaVE(poliza.inicio)) {
    return { errores: { fechaOcurrencia: ["El hecho ocurrió antes del inicio de la póliza."] } };
  }

  await db.siniestro.create({
    data: {
      polizaId: poliza.id,
      fechaOcurrencia: r.data.fechaOcurrencia,
      descripcion: r.data.descripcion,
      montoReclamadoCents: Math.round(r.data.montoReclamadoUsd * 100),
    },
  });

  await notificarAseguradora(poliza.aseguradoraId, {
    titulo: "Nuevo siniestro reportado",
    mensaje: `Póliza ${poliza.numero}: reclamo por ${usd(Math.round(r.data.montoReclamadoUsd * 100))}.`,
    link: "/aseguradora/siniestros",
  });
  await notificar(user.id, {
    titulo: "Recibimos tu reporte",
    mensaje: `Tu siniestro de la póliza ${poliza.numero} fue enviado a la aseguradora.`,
    link: `/app/polizas/${poliza.id}`,
  });

  revalidatePath(`/app/polizas/${poliza.id}`);
  return { ok: true, mensaje: "Reporte enviado. La aseguradora te contactará para continuar el proceso." };
}

// ---------------------------------------------------------------------------
// Clave de emergencia (medicina prepagada)
// ---------------------------------------------------------------------------
export type ResultadoClave =
  | (NonNullable<EstadoForm> & { clave?: { codigo: string; venceAt: string; empresa: string; clinica: string; paciente: string } })
  | undefined;

export async function solicitarClaveEmergencia(_: ResultadoClave, formData: FormData): Promise<ResultadoClave> {
  const user = await requerirRol("PERSONA");
  const r = ClaveEsquema.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };

  const poliza = await db.poliza.findFirst({
    where: { id: r.data.polizaId, userId: user.id },
    include: { aseguradora: true },
  });
  if (!poliza) return { mensaje: "Póliza no encontrada." };
  if (!RAMOS_CON_CLAVE.includes(poliza.ramo as Ramo)) {
    return { mensaje: "Esta póliza no incluye claves de emergencia. Necesitas una póliza de Medicina Prepagada." };
  }
  if (poliza.estado !== "ACTIVA" || (poliza.pagadaHasta && vencida(poliza.pagadaHasta))) {
    return { mensaje: "Tu póliza no está al día. Reporta tu pago para poder solicitar claves." };
  }

  const venceAt = new Date(Date.now() + HORAS_VIGENCIA_CLAVE * 3600 * 1000);
  let creada = null;
  for (let i = 0; i < 5 && !creada; i++) {
    creada = await db.claveEmergencia
      .create({
        data: {
          polizaId: poliza.id,
          codigo: `EMG-${codigo(4)}-${codigo(4)}`,
          paciente: r.data.paciente,
          parentesco: r.data.parentesco,
          clinica: r.data.clinica,
          motivo: r.data.motivo,
          telefono: r.data.telefono,
          venceAt,
        },
      })
      .catch(() => null); // reintenta si el código colisiona
  }
  if (!creada) return { mensaje: "No pudimos generar la clave. Intenta de nuevo o llama a la central de emergencias." };

  await notificarAseguradora(poliza.aseguradoraId, {
    titulo: "🚑 Clave de emergencia emitida",
    mensaje: `Clave ${creada.codigo} · ${r.data.paciente} en ${r.data.clinica}. Motivo: ${r.data.motivo}`,
    link: "/aseguradora/claves",
  });
  await notificar(user.id, {
    titulo: "Clave de emergencia emitida",
    mensaje: `Tu clave ${creada.codigo} es válida hasta ${fechaHora(venceAt)}. Preséntala en ${r.data.clinica}.`,
    link: `/app/polizas/${poliza.id}`,
  });

  revalidatePath("/app", "layout");
  return {
    ok: true,
    clave: {
      codigo: creada.codigo,
      venceAt: fechaHora(venceAt),
      empresa: poliza.aseguradora.nombre,
      clinica: creada.clinica,
      paciente: creada.paciente,
    },
  };
}
