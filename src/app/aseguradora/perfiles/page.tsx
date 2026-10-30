import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Badge, Encabezado, Select, Tarjeta, Vacio, cx } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  CODIGOS_PRODUCTO, ESTADOS_VE, OCUPACIONES, PRODUCTOS, VEHICULOS, edadDesde, esProducto, esReciente, haceCuanto, parseProductos,
  primaEstimada, usd, type Ocupacion, type Salud, type Vehiculo,
} from "@/lib/dominio";
import { FormularioOferta } from "./formulario-oferta";

export const metadata: Metadata = { title: "Perfiles" };

const POR_PAGINA = 20;

export default async function PerfilesPage({ searchParams }: PageProps<"/aseguradora/perfiles">) {
  const user = await requerirAseguradora();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const producto = str("producto");
  const ocupacion = str("ocupacion");
  const estado = str("estado");
  const pagina = Math.max(1, Number(str("pagina")) || 1);

  if (user.aseguradora.estado !== "APROBADA") {
    return <Vacio icono="⏳" titulo="Disponible cuando tu aseguradora sea aprobada" />;
  }

  const filtroPerfil: Prisma.PerfilWhereInput = {};
  if (ocupacion in OCUPACIONES) filtroPerfil.ocupacion = ocupacion;
  if ((ESTADOS_VE as readonly string[]).includes(estado)) filtroPerfil.estadoResidencia = estado;

  const where: Prisma.SolicitudWhereInput = {
    estado: "ABIERTA",
    expiraAt: { gt: new Date() },
    perfil: filtroPerfil,
    ...(esProducto(producto) ? { productos: { contains: producto } } : {}),
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
        ofertas: { select: { aseguradoraId: true, producto: true, estado: true, primaCents: true, sumaAseguradaUsd: true, resumen: true, exclusiones: true } },
      },
    }),
  ]);

  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams({ producto, ocupacion, estado, ...Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, String(v)])) });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `?${p}`;
  };

  return (
    <>
      <Encabezado titulo="Perfiles buscando seguro" descripcion={`${total} perfil${total === 1 ? "" : "es"} recibiendo ofertas ahora. Todos son anónimos.`} />

      <form className="mb-6 grid gap-3 sm:grid-cols-4">
        <Select name="producto" defaultValue={producto}>
          <option value="">Todas las coberturas</option>
          {CODIGOS_PRODUCTO.map((p) => <option key={p} value={p}>{PRODUCTOS[p].nombre}</option>)}
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
            const competencia = new Set(s.ofertas.filter((o) => o.aseguradoraId !== user.aseguradoraId && o.estado === "ENVIADA").map((o) => o.aseguradoraId)).size;
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
                      Publicado {haceCuanto(s.createdAt)} · {competencia} aseguradora{competencia === 1 ? "" : "s"} ya ofertaron
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {parseProductos(s.productos).map((prod) => {
                    const mia = s.ofertas.find((o) => o.aseguradoraId === user.aseguradoraId && o.producto === prod);
                    const tomada = s.ofertas.find((o) => o.producto === prod && o.estado === "ACEPTADA");
                    return (
                      <div key={prod} className={cx("rounded-xl border p-3", mia?.estado === "ENVIADA" ? "border-marca-200 bg-marca-50/40" : "border-slate-200")}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{PRODUCTOS[prod].icono} {PRODUCTOS[prod].nombre}</span>
                          {tomada ? (
                            <Badge tono={tomada.aseguradoraId === user.aseguradoraId ? "green" : "gray"}>
                              {tomada.aseguradoraId === user.aseguradoraId ? "¡Ganaste!" : "Contratado con otra"}
                            </Badge>
                          ) : mia?.estado === "ENVIADA" ? (
                            <Badge>Ofertaste {usd(mia.primaCents)}</Badge>
                          ) : null}
                        </div>
                        {!tomada && (
                          <FormularioOferta
                            solicitudId={s.id}
                            producto={prod}
                            sugerida={primaEstimada(prod, datos)}
                            sumaSugerida={PRODUCTOS[prod].sumaReferencialUsd}
                            actual={mia?.estado === "ENVIADA" ? mia : undefined}
                          />
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
