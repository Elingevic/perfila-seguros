import type { Metadata } from "next";
import { retirarOferta } from "@/actions/intermediario";
import { BotonEnviar } from "@/components/boton-enviar";
import { BadgeEstado, Encabezado, Tarjeta, Vacio } from "@/components/ui";
import { requerirIntermediario } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_OFERTA, RAMOS, codigoRamo, haceCuanto, usd, usdEntero, type Ramo, type TipoEmpresa } from "@/lib/dominio";

export const metadata: Metadata = { title: "Mis ofertas" };

export default async function OfertasIntermediarioPage() {
  const user = await requerirIntermediario();
  const ofertas = await db.oferta.findMany({
    where: { intermediarioId: user.intermediarioId },
    include: {
      solicitud: { select: { perfil: { select: { codigo: true } } } },
      aseguradora: { select: { nombre: true, tipo: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <>
      <Encabezado titulo="Mis ofertas" descripcion="Historial de propuestas que enviaste a nombre de tus empresas." />
      {ofertas.length === 0 ? (
        <Vacio icono="📨" titulo="Aún no has enviado ofertas">Ve a Perfiles para encontrar clientes.</Vacio>
      ) : (
        <Tarjeta className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Ramo</th>
                <th className="px-4 py-3">Empresa</th>
                <th className="px-4 py-3">Prima</th>
                <th className="px-4 py-3">Suma</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizada</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ofertas.map((o) => {
                const c = codigoRamo(o.ramo as Ramo, o.aseguradora.tipo as TipoEmpresa);
                return (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium">#{o.solicitud.perfil.codigo}</td>
                    <td className="px-4 py-3">
                      {RAMOS[o.ramo as Ramo].nombre}
                      {c && <div className="text-xs text-slate-500">Ramo {c.codigo}</div>}
                    </td>
                    <td className="px-4 py-3">{o.aseguradora.nombre}</td>
                    <td className="px-4 py-3">{usd(o.primaCents)}</td>
                    <td className="px-4 py-3">{usdEntero(o.sumaAseguradaUsd)}</td>
                    <td className="px-4 py-3"><BadgeEstado estado={o.estado} mapa={ESTADO_OFERTA} /></td>
                    <td className="px-4 py-3 text-slate-500">{haceCuanto(o.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {o.estado === "ENVIADA" && (
                        <form action={retirarOferta.bind(null, o.id)}>
                          <BotonEnviar variante="fantasma" tamano="sm" pendiente="…">Retirar</BotonEnviar>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Tarjeta>
      )}
    </>
  );
}
