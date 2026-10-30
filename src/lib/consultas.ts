import "server-only";
import { db } from "./db";
import { RAMOS_CON_CLAVE } from "./dominio";
import type { PolizaConClave } from "@/components/modal-clave-emergencia";

/** Pólizas del usuario con derecho a clave de emergencia (activas y al día). */
export async function polizasConClave(userId: string): Promise<PolizaConClave[]> {
  const polizas = await db.poliza.findMany({
    where: {
      userId,
      estado: "ACTIVA",
      ramo: { in: RAMOS_CON_CLAVE },
      OR: [{ pagadaHasta: null }, { pagadaHasta: { gt: new Date() } }],
    },
    include: { aseguradora: { select: { nombre: true } } },
    orderBy: { createdAt: "asc" },
  });
  return polizas.map((p) => ({ id: p.id, numero: p.numero, empresa: p.aseguradora.nombre }));
}
