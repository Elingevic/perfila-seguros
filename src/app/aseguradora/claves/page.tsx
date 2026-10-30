import type { Metadata } from "next";
import { actualizarClave } from "@/actions/aseguradora";
import { BotonEnviar } from "@/components/boton-enviar";
import { Badge, BadgeEstado, Encabezado, Tarjeta, Vacio } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_CLAVE, fechaHora, haceCuanto, usdEntero, vencida } from "@/lib/dominio";

export const metadata: Metadata = { title: "Claves de emergencia" };

export default async function ClavesPage() {
  const user = await requerirAseguradora();
  const claves = await db.claveEmergencia.findMany({
    where: { poliza: { aseguradoraId: user.aseguradoraId } },
    include: { poliza: { include: { user: { select: { nombre: true, telefono: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <Encabezado
        titulo="Claves de emergencia"
        descripcion="Claves emitidas automáticamente a afiliados con póliza activa. Confírmalas con la clínica o anúlalas si no proceden."
      />
      {claves.length === 0 ? (
        <Vacio icono="🚑" titulo="No hay claves emitidas" />
      ) : (
        <div className="space-y-3">
          {claves.map((c) => {
            const expirada = c.estado === "EMITIDA" && vencida(c.venceAt);
            return (
              <Tarjeta key={c.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold tracking-wider">{c.codigo}</span>
                      {expirada ? <Badge tono="gray">Vencida</Badge> : <BadgeEstado estado={c.estado} mapa={ESTADO_CLAVE} />}
                    </div>
                    <p className="mt-1 text-sm">
                      <b>{c.paciente}</b> ({c.parentesco}) · {c.clinica}
                    </p>
                    <p className="text-sm text-slate-600">Motivo: {c.motivo}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Póliza {c.poliza.numero} (hasta {usdEntero(c.poliza.sumaAseguradaUsd)}) · titular {c.poliza.user.nombre} · contacto {c.telefono} ·
                      emitida {haceCuanto(c.createdAt)} · vence {fechaHora(c.venceAt)}
                    </p>
                  </div>
                  {c.estado === "EMITIDA" && !expirada && (
                    <div className="flex gap-2">
                      <form action={actualizarClave.bind(null, c.id, "UTILIZADA")}>
                        <BotonEnviar tamano="sm" pendiente="…">Marcar utilizada</BotonEnviar>
                      </form>
                      <form action={actualizarClave.bind(null, c.id, "ANULADA")}>
                        <BotonEnviar tamano="sm" variante="borde" pendiente="…">Anular</BotonEnviar>
                      </form>
                    </div>
                  )}
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}
    </>
  );
}
