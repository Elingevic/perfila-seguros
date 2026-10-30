import type { Metadata } from "next";
import Link from "next/link";
import { BadgeEstado, BotonLink, Encabezado, LogoAseguradora, Tarjeta, Vacio } from "@/components/ui";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_POLIZA, PRODUCTOS, fecha, usd, usdEntero, type Producto } from "@/lib/dominio";

export const metadata: Metadata = { title: "Mis pólizas" };

export default async function PolizasPage() {
  const user = await requerirRol("PERSONA");
  const polizas = await db.poliza.findMany({
    where: { userId: user.id },
    include: { aseguradora: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Encabezado titulo="Mis pólizas" descripcion="Todas tus coberturas en un solo lugar." />
      {polizas.length === 0 ? (
        <Vacio icono="🛡️" titulo="Aún no tienes pólizas">
          Revisa tus ofertas y elige la que más te convenga.
          <div className="mt-4"><BotonLink href="/app/ofertas">Ver ofertas</BotonLink></div>
        </Vacio>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {polizas.map((p) => {
            const prod = PRODUCTOS[p.producto as Producto];
            return (
              <Link key={p.id} href={`/app/polizas/${p.id}`}>
                <Tarjeta className="transition hover:border-marca-200 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <LogoAseguradora sigla={p.aseguradora.sigla} color={p.aseguradora.color} />
                    <div className="flex-1">
                      <h3 className="font-semibold">{prod.icono} {prod.nombre}</h3>
                      <p className="text-sm text-slate-500">{p.aseguradora.nombre}</p>
                    </div>
                    <BadgeEstado estado={p.estado} mapa={ESTADO_POLIZA} />
                  </div>
                  <div className="mt-4 flex justify-between text-sm">
                    <span className="text-slate-500">N.° {p.numero}</span>
                    <span><b>{usd(p.primaCents)}</b>/mes · cubre {usdEntero(p.sumaAseguradaUsd)}</span>
                  </div>
                  {p.pagadaHasta && (
                    <p className="mt-2 text-xs text-slate-500">Pagada hasta el {fecha(p.pagadaHasta)}</p>
                  )}
                </Tarjeta>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
