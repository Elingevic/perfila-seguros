import type { Metadata } from "next";
import { gestionarVinculo } from "@/actions/aseguradora";
import { BotonEnviar } from "@/components/boton-enviar";
import { BadgeEstado, Encabezado, Tarjeta, Vacio } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_VINCULO, TIPOS_INTERMEDIARIO, fecha, type TipoIntermediario } from "@/lib/dominio";

export const metadata: Metadata = { title: "Intermediarios" };

const ORDEN: Record<string, number> = { PENDIENTE: 0, APROBADO: 1, RECHAZADO: 2 };

export default async function IntermediariosPage() {
  const user = await requerirAseguradora();
  const vinculos = await db.vinculo.findMany({
    where: { aseguradoraId: user.aseguradoraId },
    include: {
      intermediario: {
        include: {
          usuarios: { select: { nombre: true, email: true, telefono: true } },
          _count: { select: { polizas: { where: { aseguradoraId: user.aseguradoraId } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  vinculos.sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado]);

  return (
    <>
      <Encabezado
        titulo="Intermediarios"
        descripcion="Corredores, agentes y sociedades de corretaje que ofrecen tus productos. Verifica su autorización antes de aprobar."
      />
      {vinculos.length === 0 ? (
        <Vacio icono="🤝" titulo="Ningún intermediario ha solicitado vincularse todavía" />
      ) : (
        <div className="space-y-3">
          {vinculos.map((v) => {
            const i = v.intermediario;
            return (
              <Tarjeta key={v.id} className="flex flex-wrap items-center gap-4">
                <div className="min-w-60 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{i.nombre}</h3>
                    <BadgeEstado estado={v.estado} mapa={ESTADO_VINCULO} />
                    {i.estado !== "APROBADA" && <span className="text-xs text-amber-700">(autorización sin verificar)</span>}
                  </div>
                  <p className="text-xs text-slate-500">
                    {TIPOS_INTERMEDIARIO[i.tipo as TipoIntermediario].nombre} · {i.documento} · Autorización SUDEASEG {i.numeroAutorizacion} ·
                    solicitado el {fecha(v.createdAt)} · {i._count.polizas} pólizas colocadas
                  </p>
                  <p className="text-xs text-slate-500">{i.usuarios.map((u) => `${u.nombre} (${u.email}, ${u.telefono ?? "s/t"})`).join(" · ")}</p>
                </div>
                <div className="flex gap-2">
                  {v.estado !== "APROBADO" && (
                    <form action={gestionarVinculo.bind(null, v.id, true)}>
                      <BotonEnviar tamano="sm" pendiente="…">Aprobar</BotonEnviar>
                    </form>
                  )}
                  {v.estado !== "RECHAZADO" && (
                    <form action={gestionarVinculo.bind(null, v.id, false)}>
                      <BotonEnviar tamano="sm" variante="borde" pendiente="…">{v.estado === "APROBADO" ? "Revocar" : "Rechazar"}</BotonEnviar>
                    </form>
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
