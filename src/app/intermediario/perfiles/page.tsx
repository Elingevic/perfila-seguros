import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Alerta, Badge, Encabezado, Select, Tarjeta, Vacio, cx } from "@/components/ui";
import { requerirIntermediario } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  CODIGOS_RAMO, ESTADOS_VE, OCUPACIONES, RAMOS, VEHICULOS, codigoRamo, edadDesde, esRamo, esReciente, haceCuanto,
  parseRamos, primaEstimada, usd, type Ocupacion, type Salud, type TipoEmpresa, type Vehiculo,
} from "@/lib/dominio";
import { FormularioOferta, type EmpresaOpcion } from "./formulario-oferta";

export const metadata: Metadata = { title: "Perfiles" };

const POR_PAGINA = 20;

export default async function PerfilesPage({ searchParams }: PageProps<"/intermediario/perfiles">) {
  const user = await requerirIntermediario();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const ramo = str("ramo");
  const ocupacion = str("ocupacion");
  const estado = str("estado");
  const pagina = Math.max(1, Number(str("pagina")) || 1);

  if (user.intermediario.estado !== "APROBADA") {
    return <Vacio icono="⏳" titulo="Disponible cuando verifiquemos tu autorización" />;
  }

  // Empresas que este intermediario representa
  const vinculos = await db.vinculo.findMany({
    where: { intermediarioId: user.intermediarioId, estado: "APROBADO", aseguradora: { estado: "APROBADA" } },
    include: { aseguradora: { select: { id: true, nombre: true, tipo: true } } },
  });
  const empresas = vinculos.map((v) => v.aseguradora);

  const filtroPerfil: Prisma.PerfilWhereInput = {};
  if (ocupacion in OCUPACIONES) filtroPerfil.ocupacion = ocupacion;
  if ((ESTADOS_VE as readonly string[]).includes(estado)) filtroPerfil.estadoResidencia = estado;

  const where: Prisma.SolicitudWhereInput = {
    estado: "ABIERTA",
    expiraAt: { gt: new Date() },
    perfil: filtroPerfil,
    ...(esRamo(ramo) ? { ramos: { contains: ramo } } : {}),
  };

  const [total, solicitudes] = await Promise.all([
    db.solicitud.count({ where }),
    db.solicitud.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: {
        // Solo datos anónimos del perfil: nunca nombre ni contacto
        perfil: {
          select: {
            codigo: true, fechaNacimiento: true, estadoResidencia: true, ocupacion: true,
            vehiculo: true, dependientes: true, salud: true, presupuestoUsd: true,
          },
        },
        ofertas: {
          select: {
            intermediarioId: true, aseguradoraId: true, ramo: true, estado: true, primaCents: true,
            sumaAseguradaUsd: true, resumen: true, exclusiones: true, aseguradora: { select: { nombre: true } },
          },
        },
      },
    }),
  ]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams({ ramo, ocupacion, estado, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])) });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `?${p}`;
  };

  return (
    <>
      <Encabezado titulo="Perfiles buscando seguro" descripcion={`${total} perfil${total === 1 ? "" : "es"} recibiendo ofertas ahora. Todos son anónimos.`} />

      {empresas.length === 0 && (
        <div className="mb-6">
          <Alerta tono="amber">
            Aún no representas a ninguna empresa, así que no puedes ofertar.{" "}
            <Link href="/intermediario/empresas" className="font-semibold underline">Solicita tus vínculos</Link>.
          </Alerta>
        </div>
      )}

      <form className="mb-6 grid gap-3 sm:grid-cols-4">
        <Select name="ramo" defaultValue={ramo}>
          <option value="">Todos los ramos</option>
          {CODIGOS_RAMO.map((r) => <option key={r} value={r}>{RAMOS[r].nombre}</option>)}
        </Select>
        <Select name="ocupacion" defaultValue={ocupacion}>
          <option value="">Todas las ocupaciones</option>
          {Object.entries(OCUPACIONES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select name="estado" defaultValue={estado}>
          <option value="">Todos los estados</option>
          {ESTADOS_VE.map((e) => <option key={e}>{e}</option>)}
        </Select>
        <button className="rounded-xl bg-marca-900 px-4 py-2.5 text-sm font-semibold text-white">Filtrar</button>
      </form>

      {solicitudes.length === 0 ? (
        <Vacio icono="🔎" titulo="No hay perfiles con estos filtros">Prueba con otros filtros o vuelve más tarde.</Vacio>
      ) : (
        <div className="space-y-4">
          {solicitudes.map((s) => {
            const p = s.perfil;
            const edad = edadDesde(p.fechaNacimiento);
            const datos = {
              edad, ocupacion: p.ocupacion as Ocupacion, vehiculo: p.vehiculo as Vehiculo,
              dependientes: p.dependientes, salud: p.salud as Salud, presupuestoUsd: p.presupuestoUsd,
            };
            const competencia = new Set(
              s.ofertas.filter((o) => o.intermediarioId !== user.intermediarioId && o.estado === "ENVIADA").map((o) => o.intermediarioId),
            ).size;
            return (
              <Tarjeta key={s.id}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Perfil #{p.codigo}</h3>
                      {esReciente(s.createdAt) && <Badge tono="red">Nuevo</Badge>}
                    </div>
                    <p className="text-sm text-slate-600">
                      {edad} años · {OCUPACIONES[datos.ocupacion]} · {p.estadoResidencia} · {VEHICULOS[datos.vehiculo]} ·{" "}
                      {p.dependientes === 0 ? "sin dependientes" : `${p.dependientes} dependiente${p.dependientes > 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <div>Presupuesto <b>${p.presupuestoUsd}/mes</b></div>
                    <div className="text-xs text-slate-500">
                      Publicado {haceCuanto(s.createdAt)} · {competencia} intermediario{competencia === 1 ? "" : "s"} ya ofertaron
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {parseRamos(s.ramos).map((r) => {
                    const mias = s.ofertas.filter((o) => o.intermediarioId === user.intermediarioId && o.ramo === r && o.estado === "ENVIADA");
                    const tomada = s.ofertas.find((o) => o.ramo === r && o.estado === "ACEPTADA");
                    const opciones: EmpresaOpcion[] = empresas.flatMap((e) => {
                      const c = codigoRamo(r, e.tipo as TipoEmpresa);
                      if (!c) return [];
                      const actual = mias.find((m) => m.aseguradoraId === e.id);
                      return [{ id: e.id, nombre: e.nombre, codigo: c.codigo, nombreRamo: c.nombre, actual }];
                    });
                    return (
                      <div key={r} className={cx("rounded-xl border p-3", mias.length ? "border-marca-200 bg-marca-50/40" : "border-slate-200")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{RAMOS[r].icono} {RAMOS[r].nombre}</span>
                          {tomada ? (
                            <Badge tono={tomada.intermediarioId === user.intermediarioId ? "green" : "gray"}>
                              {tomada.intermediarioId === user.intermediarioId ? "¡Ganaste!" : "Contratado con otro"}
                            </Badge>
                          ) : null}
                        </div>
                        {mias.length > 0 && !tomada && (
                          <ul className="mt-1 space-y-0.5 text-xs text-marca-700">
                            {mias.map((m) => <li key={m.aseguradoraId}>Ofertaste {usd(m.primaCents)} con {m.aseguradora.nombre}</li>)}
                          </ul>
                        )}
                        {!tomada && (
                          opciones.length > 0 ? (
                            <FormularioOferta
                              solicitudId={s.id}
                              ramo={r}
                              empresas={opciones}
                              sugerida={primaEstimada(r, datos)}
                              sumaSugerida={RAMOS[r].sumaReferencialUsd}
                            />
                          ) : (
                            <p className="mt-2 text-xs text-slate-500">Ninguna de tus empresas opera este ramo.</p>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      {paginas > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          {pagina > 1 && <Link className="font-semibold text-marca-600" href={qs({ pagina: pagina - 1 })}>‹ Anterior</Link>}
          <span className="text-slate-500">Página {pagina} de {paginas}</span>
          {pagina < paginas && <Link className="font-semibold text-marca-600" href={qs({ pagina: pagina + 1 })}>Siguiente ›</Link>}
        </div>
      )}
    </>
  );
}
