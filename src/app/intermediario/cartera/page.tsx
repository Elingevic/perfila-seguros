import type { Metadata } from "next";
import { BadgeEstado, Encabezado, Kpi, Tarjeta, Vacio } from "@/components/ui";
import { requerirIntermediario } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_POLIZA, RAMOS, codigoRamo, fecha, usd, usdEntero, type Ramo, type TipoEmpresa } from "@/lib/dominio";

export const metadata: Metadata = { title: "Mi cartera" };

export default async function CarteraPage() {
  const user = await requerirIntermediario();
  const polizas = await db.poliza.findMany({
    where: { intermediarioId: user.intermediarioId },
    include: {
      user: { select: { nombre: true, email: true, telefono: true } },
      aseguradora: { select: { nombre: true, tipo: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  const activas = polizas.filter((p) => p.estado === "ACTIVA");
  const pendientes = polizas.filter((p) => p.estado === "PENDIENTE_PAGO");

  return (
    <>
      <Encabezado titulo="Mi cartera" descripcion="Pólizas colocadas por ti. Haz seguimiento a los pagos pendientes con tus clientes." />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        <Kpi valor={activas.length} etiqueta="Pólizas activas" />
        <Kpi valor={pendientes.length} etiqueta="Esperando primer pago" />
        <Kpi valor={usd(activas.reduce((s, p) => s + p.primaCents, 0))} etiqueta="Primas mensuales activas" />
      </div>
      {polizas.length === 0 ? (
        <Vacio icono="💼" titulo="Aún no tienes pólizas en tu cartera" />
      ) : (
        <Tarjeta className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Póliza</th>
                <th className="px-4 py-3">Asegurado</th>
                <th className="px-4 py-3">Ramo · Empresa</th>
                <th className="px-4 py-3">Prima</th>
                <th className="px-4 py-3">Pagada hasta</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {polizas.map((p) => {
                const c = codigoRamo(p.ramo as Ramo, p.aseguradora.tipo as TipoEmpresa);
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs">{p.numero}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.user.nombre}</div>
                      <div className="text-xs text-slate-500">{p.user.telefono} · {p.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {RAMOS[p.ramo as Ramo].nombre}{c && <span className="text-xs text-slate-500"> (ramo {c.codigo})</span>}
                      <div className="text-xs text-slate-500">{p.aseguradora.nombre} · hasta {usdEntero(p.sumaAseguradaUsd)}</div>
                    </td>
                    <td className="px-4 py-3">{usd(p.primaCents)}</td>
                    <td className="px-4 py-3">{p.pagadaHasta ? fecha(p.pagadaHasta) : "—"}</td>
                    <td className="px-4 py-3"><BadgeEstado estado={p.estado} mapa={ESTADO_POLIZA} /></td>
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
