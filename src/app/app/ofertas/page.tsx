import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { Alerta, Badge, BotonLink, Encabezado, LogoAseguradora, Tarjeta, Vacio, cx } from "@/components/ui";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  RAMOS, TIPOS_EMPRESA, TIPOS_INTERMEDIARIO, codigoRamo, parseRamos, vigenciaSolicitud, usd, usdEntero,
  type Ramo, type TipoEmpresa, type TipoIntermediario,
} from "@/lib/dominio";
import { BotonAceptar } from "./boton-aceptar";

export const metadata: Metadata = { title: "Mis ofertas" };

export default async function OfertasPage({ searchParams }: PageProps<"/app/ofertas">) {
  const user = await requerirRol("PERSONA");
  const { publicado } = await searchParams;

  const perfil = await db.perfil.findUnique({ where: { userId: user.id }, select: { id: true, presupuestoUsd: true } });
  if (!perfil) redirect("/app/perfil/crear");

  // La solicitud abierta, o la última si no hay ninguna abierta
  const solicitud =
    (await db.solicitud.findFirst({ where: { perfilId: perfil.id, estado: "ABIERTA" }, orderBy: { createdAt: "desc" } })) ??
    (await db.solicitud.findFirst({ where: { perfilId: perfil.id }, orderBy: { createdAt: "desc" } }));

  if (!solicitud) {
    return (
      <Vacio icono="📭" titulo="Aún no has publicado tu perfil">
        <BotonLink href="/app/perfil/crear" className="mt-4">Publicar perfil</BotonLink>
      </Vacio>
    );
  }

  const ofertas = await db.oferta.findMany({
    where: {
      solicitudId: solicitud.id,
      estado: { in: ["ENVIADA", "ACEPTADA"] },
      aseguradora: { estado: "APROBADA" },
      intermediario: { estado: "APROBADA" },
    },
    include: { aseguradora: true, intermediario: true, poliza: { select: { id: true } } },
    orderBy: { primaCents: "asc" },
  });

  const ramos = parseRamos(solicitud.ramos);
  const abierta = solicitud.estado === "ABIERTA";
  const elegidas = ofertas.filter((o) => o.estado === "ACEPTADA");
  const totalElegido = elegidas.reduce((s, o) => s + o.primaCents, 0);

  return (
    <>
      <Encabezado
        titulo="Tus ofertas"
        descripcion={
          abierta
            ? `Tu perfil recibe ofertas ${vigenciaSolicitud(solicitud.expiraAt)}. Elige una oferta por cobertura.`
            : "Esta solicitud está cerrada. Publica tu perfil de nuevo para recibir más ofertas."
        }
        accion={!abierta && <BotonLink href="/app/perfil/crear">Publicar de nuevo</BotonLink>}
      />

      {publicado && (
        <div className="mb-6">
          <Alerta tono="green">
            <b>¡Tu perfil está publicado!</b> Los corredores y agentes autorizados ya pueden verlo. Te avisaremos cada vez que llegue una oferta.
          </Alerta>
        </div>
      )}

      <Tarjeta className="mb-6 flex flex-wrap items-center gap-6">
        <div className="flex-1">
          <div className="text-sm text-slate-500">Tu plan elegido</div>
          <div className="text-2xl font-bold">{usd(totalElegido)}<span className="text-sm font-normal text-slate-500">/mes</span></div>
        </div>
        <div className="w-full sm:w-64">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Presupuesto</span><span>${perfil.presupuestoUsd}/mes</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cx("h-full rounded-full", totalElegido > perfil.presupuestoUsd * 100 ? "bg-amber-500" : "bg-green-500")}
              style={{ width: `${Math.min(100, (totalElegido / (perfil.presupuestoUsd * 100)) * 100)}%` }}
            />
          </div>
        </div>
      </Tarjeta>

      <div className="space-y-10">
        {ramos.map((prod) => (
          <SeccionProducto key={prod} ramo={prod} ofertas={ofertas.filter((o) => o.ramo === prod)} abierta={abierta} />
        ))}
      </div>
    </>
  );
}

type OfertaConAseguradora = Prisma.OfertaGetPayload<{ include: { aseguradora: true; intermediario: true; poliza: { select: { id: true } } } }>;

function SeccionProducto({ ramo, ofertas, abierta }: { ramo: Ramo; ofertas: OfertaConAseguradora[]; abierta: boolean }) {
  const info = RAMOS[ramo];
  const aceptada = ofertas.find((o) => o.estado === "ACEPTADA");
  const minPrima = Math.min(...ofertas.map((o) => o.primaCents));
  const maxSuma = Math.max(...ofertas.map((o) => o.sumaAseguradaUsd));
  const minDias = Math.min(...ofertas.map((o) => o.aseguradora.diasPromedioPago ?? 999));

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-2xl">{info.icono}</span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{info.nombre}</h2>
          <p className="text-sm text-slate-500">{info.descripcion}</p>
        </div>
        <Badge tono={aceptada ? "green" : "gray"}>
          {aceptada ? "✓ Elegida" : `${ofertas.length} oferta${ofertas.length === 1 ? "" : "s"}`}
        </Badge>
      </div>

      {ofertas.length === 0 ? (
        <Tarjeta className="flex items-center gap-3 text-sm text-slate-600">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-marca-500 opacity-60" />
            <span className="relative inline-flex size-3 rounded-full bg-marca-600" />
          </span>
          Esperando ofertas de corredores y agentes…
        </Tarjeta>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ofertas.map((o) => {
            const etiquetas: [string, "green" | "blue" | "amber"][] = [];
            if (ofertas.length > 1 && o.primaCents === minPrima) etiquetas.push(["Más barata", "green"]);
            if (ofertas.length > 1 && o.sumaAseguradaUsd === maxSuma) etiquetas.push(["Mayor cobertura", "blue"]);
            if (ofertas.length > 1 && o.aseguradora.diasPromedioPago === minDias) etiquetas.push(["Paga más rápido", "amber"]);
            const esLaElegida = o.estado === "ACEPTADA";
            return (
              <Tarjeta key={o.id} className={cx("flex flex-col", esLaElegida && "border-2 border-green-500", aceptada && !esLaElegida && "opacity-50")}>
                {/* Quien propone: el intermediario */}
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-marca-900 text-sm font-bold text-white">
                    {iniciales(o.intermediario.nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{o.intermediario.nombre}</h3>
                    <p className="text-xs text-slate-500">
                      {TIPOS_INTERMEDIARIO[o.intermediario.tipo as TipoIntermediario].nombre} · Aut. {o.intermediario.numeroAutorizacion}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {etiquetas.map(([t, tono]) => <Badge key={t} tono={tono}>{t}</Badge>)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{usd(o.primaCents)}</div>
                    <div className="text-xs text-slate-500">al mes</div>
                  </div>
                </div>
                {/* Quien respalda: la empresa */}
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2">
                  <LogoAseguradora sigla={o.aseguradora.sigla} color={o.aseguradora.color} tamano={28} />
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="truncate font-semibold text-slate-800">{o.aseguradora.nombre}</div>
                    <div className="text-slate-500">
                      {TIPOS_EMPRESA[o.aseguradora.tipo as TipoEmpresa].nombre}
                      {(() => {
                        const c = codigoRamo(o.ramo as Ramo, o.aseguradora.tipo as TipoEmpresa);
                        return c ? ` · Ramo ${c.codigo} ${c.nombre}` : "";
                      })()}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Dato valor={usdEntero(o.sumaAseguradaUsd)} etiqueta="te cubre hasta" />
                  <Dato valor={o.aseguradora.siniestrosPagadosPct != null ? `${o.aseguradora.siniestrosPagadosPct}%` : "—"} etiqueta="reclamos pagados" />
                  <Dato valor={o.aseguradora.diasPromedioPago != null ? `${o.aseguradora.diasPromedioPago} días` : "—"} etiqueta="tarda en pagar" />
                </div>
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer font-medium text-marca-600">Qué cubre y qué no</summary>
                  <p className="mt-2 text-slate-700"><b>Cubre:</b> {o.resumen}</p>
                  <p className="mt-2 text-slate-700"><b>No cubre:</b> {o.exclusiones}</p>
                </details>
                <div className="mt-auto pt-4">
                  {esLaElegida && o.poliza ? (
                    <BotonLink href={`/app/polizas/${o.poliza.id}`} variante="secundario" bloque>Ver mi póliza</BotonLink>
                  ) : !aceptada && abierta ? (
                    <BotonAceptar ofertaId={o.id} intermediario={o.intermediario.nombre} aseguradora={o.aseguradora.nombre} prima={usd(o.primaCents)} />
                  ) : null}
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <div className="text-sm font-semibold">{valor}</div>
      <div className="text-[11px] text-slate-500">{etiqueta}</div>
    </div>
  );
}

function iniciales(nombre: string) {
  return nombre
    .split(/\s+/)
    .filter((w) => /^\p{L}{2,}/u.test(w)) // ignora "C.A.", "S.A." y similares
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}
