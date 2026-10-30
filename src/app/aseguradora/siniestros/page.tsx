import type { Metadata } from "next";
import { actualizarSiniestro } from "@/actions/aseguradora";
import { BotonEnviar } from "@/components/boton-enviar";
import { BadgeEstado, Encabezado, Select, Tarjeta, Textarea, Vacio } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_SINIESTRO, PRODUCTOS, fecha, haceCuanto, usd, usdEntero, type Producto } from "@/lib/dominio";

export const metadata: Metadata = { title: "Siniestros" };

export default async function SiniestrosPage() {
  const user = await requerirAseguradora();
  const siniestros = await db.siniestro.findMany({
    where: { poliza: { aseguradoraId: user.aseguradoraId } },
    include: { poliza: { include: { user: { select: { nombre: true, email: true, telefono: true } } } } },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
  });
  const abiertos = siniestros.filter((s) => s.estado === "REPORTADO" || s.estado === "EN_REVISION");
  const cerrados = siniestros.filter((s) => !abiertos.includes(s));

  return (
    <>
      <Encabezado titulo="Siniestros" descripcion={`${abiertos.length} por atender.`} />
      {siniestros.length === 0 ? (
        <Vacio icono="🆘" titulo="No hay siniestros reportados" />
      ) : (
        <div className="space-y-4">
          {[...abiertos, ...cerrados].map((s) => (
            <Tarjeta key={s.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Reclamo por {usd(s.montoReclamadoCents)}</h3>
                    <BadgeEstado estado={s.estado} mapa={ESTADO_SINIESTRO} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Póliza {s.poliza.numero} · {PRODUCTOS[s.poliza.producto as Producto].nombre} (hasta {usdEntero(s.poliza.sumaAseguradaUsd)}) ·
                    ocurrió el {fecha(s.fechaOcurrencia)} · reportado {haceCuanto(s.createdAt)}
                  </p>
                  <p className="text-xs text-slate-500">{s.poliza.user.nombre} · {s.poliza.user.telefono} · {s.poliza.user.email}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm">{s.descripcion}</p>
              <form action={actualizarSiniestro.bind(null, s.id)} className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr_auto]">
                <Select name="estado" defaultValue={s.estado}>
                  {Object.entries(ESTADO_SINIESTRO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
                <Textarea name="respuesta" className="min-h-11 text-sm" placeholder="Mensaje para el asegurado (opcional)" defaultValue={s.respuesta ?? ""} />
                <BotonEnviar pendiente="Guardando…">Actualizar</BotonEnviar>
              </form>
            </Tarjeta>
          ))}
        </div>
      )}
    </>
  );
}
