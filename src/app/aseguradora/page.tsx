import Link from "next/link";
import { BotonLink, Encabezado, Kpi, Tarjeta } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { PRODUCTOS, haceCuanto, usd, type Producto } from "@/lib/dominio";

export default async function ResumenAseguradoraPage() {
  const user = await requerirAseguradora();
  const id = user.aseguradoraId;
  const ahora = new Date();

  const [abiertas, enviadas, aceptadas, totalOfertas, activas, pagosPendientes, siniestrosAbiertos, recientes] = await Promise.all([
    db.solicitud.count({ where: { estado: "ABIERTA", expiraAt: { gt: ahora } } }),
    db.oferta.count({ where: { aseguradoraId: id, estado: "ENVIADA" } }),
    db.oferta.count({ where: { aseguradoraId: id, estado: "ACEPTADA" } }),
    db.oferta.count({ where: { aseguradoraId: id, estado: { in: ["ENVIADA", "ACEPTADA", "RECHAZADA"] } } }),
    db.poliza.findMany({ where: { aseguradoraId: id, estado: "ACTIVA" }, select: { primaCents: true } }),
    db.pago.count({ where: { estado: "EN_REVISION", poliza: { aseguradoraId: id } } }),
    db.siniestro.count({ where: { estado: { in: ["REPORTADO", "EN_REVISION"] }, poliza: { aseguradoraId: id } } }),
    db.poliza.findMany({
      where: { aseguradoraId: id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { nombre: true } } },
    }),
  ]);

  const decididas = totalOfertas - enviadas;
  const conversion = decididas > 0 ? Math.round((aceptadas / decididas) * 100) : 0;
  const primas = activas.reduce((s, p) => s + p.primaCents, 0);

  return (
    <>
      <Encabezado
        titulo={`Hola, ${user.nombre.split(" ")[0]}`}
        descripcion={`Resumen de ${user.aseguradora.nombre} en Perfila.`}
        accion={<BotonLink href="/aseguradora/perfiles">Ver perfiles buscando seguro</BotonLink>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi valor={abiertas} etiqueta="Perfiles recibiendo ofertas" />
        <Kpi valor={enviadas} etiqueta="Ofertas en espera" />
        <Kpi valor={`${conversion}%`} etiqueta="Conversión de ofertas" />
        <Kpi valor={usd(primas)} etiqueta={`Primas mensuales (${activas.length} pólizas)`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Últimas pólizas emitidas</h2>
            <Link href="/aseguradora/polizas" className="text-sm font-semibold text-marca-600">Ver todas</Link>
          </div>
          {recientes.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no tienes pólizas. Envía ofertas a los perfiles abiertos para empezar.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recientes.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{PRODUCTOS[p.producto as Producto].icono} {PRODUCTOS[p.producto as Producto].nombre}</div>
                    <div className="text-xs text-slate-500">{p.user.nombre} · {p.numero} · {haceCuanto(p.createdAt)}</div>
                  </div>
                  <b>{usd(p.primaCents)}/mes</b>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <div className="space-y-4">
          <Pendiente href="/aseguradora/polizas?tab=pagos" icono="💳" n={pagosPendientes} texto="pagos por verificar" />
          <Pendiente href="/aseguradora/siniestros" icono="🆘" n={siniestrosAbiertos} texto="siniestros por atender" />
          <Pendiente href="/aseguradora/ofertas" icono="📨" n={enviadas} texto="ofertas esperando respuesta" />
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
