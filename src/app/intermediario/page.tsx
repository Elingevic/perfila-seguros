import Link from "next/link";
import { Alerta, Badge, BotonLink, Encabezado, Kpi, Tarjeta } from "@/components/ui";
import { requerirIntermediario } from "@/lib/dal";
import { db } from "@/lib/db";
import { RAMOS, TIPOS_INTERMEDIARIO, haceCuanto, usd, type Ramo, type TipoIntermediario } from "@/lib/dominio";

export default async function ResumenIntermediarioPage() {
  const user = await requerirIntermediario();
  const id = user.intermediarioId;
  const ahora = new Date();

  const [abiertas, enviadas, aceptadas, decididas, activas, vinculos, recientes] = await Promise.all([
    db.solicitud.count({ where: { estado: "ABIERTA", expiraAt: { gt: ahora } } }),
    db.oferta.count({ where: { intermediarioId: id, estado: "ENVIADA" } }),
    db.oferta.count({ where: { intermediarioId: id, estado: "ACEPTADA" } }),
    db.oferta.count({ where: { intermediarioId: id, estado: { in: ["ACEPTADA", "RECHAZADA"] } } }),
    db.poliza.findMany({ where: { intermediarioId: id, estado: "ACTIVA" }, select: { primaCents: true } }),
    db.vinculo.findMany({ where: { intermediarioId: id }, include: { aseguradora: { select: { nombre: true } } } }),
    db.poliza.findMany({
      where: { intermediarioId: id },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { nombre: true } }, aseguradora: { select: { nombre: true } } },
    }),
  ]);

  const aprobados = vinculos.filter((v) => v.estado === "APROBADO");
  const conversion = decididas > 0 ? Math.round((aceptadas / decididas) * 100) : 0;
  const primas = activas.reduce((s, p) => s + p.primaCents, 0);

  return (
    <>
      <Encabezado
        titulo={`Hola, ${user.nombre.split(" ")[0]}`}
        descripcion={
          <>
            {user.intermediario.nombre} · {TIPOS_INTERMEDIARIO[user.intermediario.tipo as TipoIntermediario].nombre} · Autorización{" "}
            {user.intermediario.numeroAutorizacion}
          </>
        }
        accion={<BotonLink href="/intermediario/perfiles">Ver perfiles buscando seguro</BotonLink>}
      />

      {user.intermediario.estado === "APROBADA" && aprobados.length === 0 && (
        <div className="mb-6">
          <Alerta tono="blue">
            Para ofertar necesitas estar vinculado al menos a una empresa.{" "}
            <Link href="/intermediario/empresas" className="font-semibold underline">Solicita tus vínculos</Link>.
          </Alerta>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi valor={abiertas} etiqueta="Perfiles recibiendo ofertas" />
        <Kpi valor={enviadas} etiqueta="Ofertas en espera" />
        <Kpi valor={`${conversion}%`} etiqueta="Conversión de ofertas" />
        <Kpi valor={usd(primas)} etiqueta={`Primas de tu cartera (${activas.length} pólizas)`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Tarjeta className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Últimas pólizas colocadas</h2>
            <Link href="/intermediario/cartera" className="text-sm font-semibold text-marca-600">Ver cartera</Link>
          </div>
          {recientes.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no has colocado pólizas. Envía ofertas a los perfiles abiertos para empezar.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recientes.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-medium">{RAMOS[p.ramo as Ramo].icono} {RAMOS[p.ramo as Ramo].nombre}</div>
                    <div className="text-xs text-slate-500">{p.user.nombre} · {p.aseguradora.nombre} · {haceCuanto(p.createdAt)}</div>
                  </div>
                  <b>{usd(p.primaCents)}/mes</b>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta className="h-fit">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Empresas que representas</h2>
            <Link href="/intermediario/empresas" className="text-sm font-semibold text-marca-600">Gestionar</Link>
          </div>
          {vinculos.length === 0 ? (
            <p className="text-sm text-slate-500">Ninguna todavía.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {vinculos.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2">
                  <span>{v.aseguradora.nombre}</span>
                  <Badge tono={v.estado === "APROBADO" ? "green" : v.estado === "PENDIENTE" ? "amber" : "red"}>
                    {v.estado === "APROBADO" ? "Vinculado" : v.estado === "PENDIENTE" ? "Por aprobar" : "Rechazado"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
