import { Encabezado, Kpi, Tarjeta } from "@/components/ui";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { CODIGOS_PRODUCTO, OCUPACIONES, PRODUCTOS, usd, type Ocupacion } from "@/lib/dominio";

export default async function AdminPage() {
  await requerirRol("ADMIN");
  const [personas, perfiles, solicitudesAbiertas, ofertas, polizasActivas, pendientesAprob, porProducto, porOcupacion] = await Promise.all([
    db.user.count({ where: { rol: "PERSONA" } }),
    db.perfil.count(),
    db.solicitud.count({ where: { estado: "ABIERTA", expiraAt: { gt: new Date() } } }),
    db.oferta.count(),
    db.poliza.findMany({ where: { estado: "ACTIVA" }, select: { primaCents: true } }),
    db.aseguradora.count({ where: { estado: "PENDIENTE" } }),
    db.poliza.groupBy({ by: ["producto"], _count: true, where: { estado: { not: "CANCELADA" } } }),
    db.perfil.groupBy({ by: ["ocupacion"], _count: true }),
  ]);
  const primas = polizasActivas.reduce((s, p) => s + p.primaCents, 0);
  const conPoliza = await db.user.count({ where: { rol: "PERSONA", polizas: { some: { estado: "ACTIVA" } } } });

  return (
    <>
      <Encabezado titulo="Panel de administración" descripcion="Indicadores de impacto de Perfila." />
      {pendientesAprob > 0 && (
        <Tarjeta className="mb-6 border-amber-200 bg-amber-50 text-sm">
          ⏳ Hay <b>{pendientesAprob}</b> aseguradora(s) esperando aprobación. <a className="font-semibold text-marca-600" href="/admin/aseguradoras">Revisar</a>
        </Tarjeta>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi valor={personas} etiqueta="Personas registradas" />
        <Kpi valor={perfiles} etiqueta="Perfiles creados" />
        <Kpi valor={conPoliza} etiqueta="Personas aseguradas" />
        <Kpi valor={personas ? `${Math.round((conPoliza / personas) * 100)}%` : "—"} etiqueta="Conversión a asegurado" />
        <Kpi valor={solicitudesAbiertas} etiqueta="Perfiles publicados" />
        <Kpi valor={ofertas} etiqueta="Ofertas enviadas" />
        <Kpi valor={polizasActivas.length} etiqueta="Pólizas activas" />
        <Kpi valor={usd(primas)} etiqueta="Primas mensuales activas" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Barras
          titulo="Pólizas por cobertura"
          datos={CODIGOS_PRODUCTO.map((p) => [PRODUCTOS[p].nombre, porProducto.find((x) => x.producto === p)?._count ?? 0])}
        />
        <Barras
          titulo="Perfiles por ocupación"
          datos={Object.keys(OCUPACIONES).map((o) => [OCUPACIONES[o as Ocupacion], porOcupacion.find((x) => x.ocupacion === o)?._count ?? 0])}
        />
      </div>
    </>
  );
}

function Barras({ titulo, datos }: { titulo: string; datos: [string, number][] }) {
  const max = Math.max(1, ...datos.map(([, n]) => n));
  return (
    <Tarjeta>
      <h2 className="mb-4 font-semibold">{titulo}</h2>
      <ul className="space-y-3">
        {datos.map(([k, n]) => (
          <li key={k} className="text-sm">
            <div className="mb-1 flex justify-between"><span>{k}</span><b>{n}</b></div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-marca-600" style={{ width: `${(n / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </Tarjeta>
  );
}
