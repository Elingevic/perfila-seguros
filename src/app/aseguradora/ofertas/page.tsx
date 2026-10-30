import type { Metadata } from "next";
import { retirarOferta } from "@/actions/aseguradora";
import { BotonEnviar } from "@/components/boton-enviar";
import { BadgeEstado, Encabezado, Tarjeta, Vacio } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_OFERTA, PRODUCTOS, haceCuanto, usd, usdEntero, type Producto } from "@/lib/dominio";

export const metadata: Metadata = { title: "Mis ofertas" };

export default async function OfertasAseguradoraPage() {
  const user = await requerirAseguradora();
  const ofertas = await db.oferta.findMany({
    where: { aseguradoraId: user.aseguradoraId },
    include: { solicitud: { select: { estado: true, perfil: { select: { codigo: true } } } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <>
      <Encabezado titulo="Mis ofertas" descripcion="Historial de ofertas enviadas por tu aseguradora." />
      {ofertas.length === 0 ? (
        <Vacio icono="📨" titulo="Aún no has enviado ofertas">Ve a Perfiles para encontrar clientes.</Vacio>
      ) : (
        <Tarjeta className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Cobertura</th>
                <th className="px-4 py-3">Prima</th>
                <th className="px-4 py-3">Suma</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Actualizada</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ofertas.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium">#{o.solicitud.perfil.codigo}</td>
                  <td className="px-4 py-3">{PRODUCTOS[o.producto as Producto].nombre}</td>
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
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
    </>
  );
}
