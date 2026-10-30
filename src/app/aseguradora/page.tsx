import Link from "next/link";
import { Encabezado, Kpi, Tarjeta } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { RAMOS, TIPOS_EMPRESA, haceCuanto, usd, type Ramo, type TipoEmpresa } from "@/lib/dominio";

export default async function ResumenAseguradoraPage() {
  const user = await requerirAseguradora();
  const id = user.aseguradoraId;

  const [intermediarios, vinculosPendientes, ofertasVigentes, activas, pagosPendientes, siniestrosAbiertos, clavesVigentes, recientes] =
    await Promise.all([
      db.vinculo.count({ where: { aseguradoraId: id, estado: "APROBADO" } }),
      db.vinculo.count({ where: { aseguradoraId: id, estado: "PENDIENTE" } }),
      db.oferta.count({ where: { aseguradoraId: id, estado: "ENVIADA" } }),
      db.poliza.findMany({ where: { aseguradoraId: id, estado: "ACTIVA" }, select: { primaCents: true } }),
      db.pago.count({ where: { estado: "EN_REVISION", poliza: { aseguradoraId: id } } }),
      db.siniestro.count({ where: { estado: { in: ["REPORTADO", "EN_REVISION"] }, poliza: { aseguradoraId: id } } }),
      db.claveEmergencia.count({ where: { estado: "EMITIDA", venceAt: { gt: new Date() }, poliza: { aseguradoraId: id } } }),
      db.poliza.findMany({
        where: { aseguradoraId: id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: { select: { nombre: true } }, intermediario: { select: { nombre: true } } },
      }),
    ]);

  const primas = activas.reduce((s, p) => s + p.primaCents, 0);

  return (
    <>
      <Encabezado
        titulo={`Hola, ${user.nombre.split(" ")[0]}`}
        descripcion={`${user.aseguradora.nombre} · ${TIPOS_EMPRESA[user.aseguradora.tipo as TipoEmpresa].nombre}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi valor={intermediarios} etiqueta="Intermediarios vinculados" />
        <Kpi valor={ofertasVigentes} etiqueta="Ofertas vigentes con tu respaldo" />
        <Kpi valor={activas.length} etiqueta="Pólizas activas" />
        <Kpi valor={usd(primas)} etiqueta="Primas mensuales activas" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Últimas pólizas emitidas</h2>
            <Link href="/aseguradora/polizas" className="text-sm font-semibold text-marca-600">Ver todas</Link>
          </div>
          {recientes.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay pólizas. Aprueba intermediarios para que ofrezcan tus productos.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recientes.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{RAMOS[p.ramo as Ramo].icono} {RAMOS[p.ramo as Ramo].nombre}</div>
                    <div className="text-xs text-slate-500">
                      {p.user.nombre} · vía {p.intermediario.nombre} · {p.numero} · {haceCuanto(p.createdAt)}
                    </div>
                  </div>
                  <b>{usd(p.primaCents)}/mes</b>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <div className="space-y-4">
          {clavesVigentes > 0 && <Pendiente href="/aseguradora/claves" icono="🚑" n={clavesVigentes} texto="claves de emergencia vigentes" />}
          <Pendiente href="/aseguradora/polizas?tab=pagos" icono="💳" n={pagosPendientes} texto="pagos por verificar" />
          <Pendiente href="/aseguradora/siniestros" icono="🆘" n={siniestrosAbiertos} texto="siniestros por atender" />
          <Pendiente href="/aseguradora/intermediarios" icono="🤝" n={vinculosPendientes} texto="intermediarios por aprobar" />
        </div>
      </div>
    </>
  );
}

function Pendiente({ href, icono, n, texto }: { href: string; icono: string; n: number; texto: string }) {
  return (
    <Link href={href}>
      <Tarjeta className="flex items-center gap-4 transition hover:border-marca-200">
        <span className="text-2xl">{icono}</span>
        <div className="flex-1">
          <div className="text-xl font-bold">{n}</div>
          <div className="text-sm text-slate-500">{texto}</div>
        </div>
        <span className="text-slate-400">›</span>
      </Tarjeta>
    </Link>
  );
}
