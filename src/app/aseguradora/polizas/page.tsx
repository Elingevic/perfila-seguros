import type { Metadata } from "next";
import Link from "next/link";
import { verificarPago } from "@/actions/aseguradora";
import { BotonEnviar } from "@/components/boton-enviar";
import { BadgeEstado, Encabezado, Input, Tarjeta, Vacio, cx } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_POLIZA, METODOS_PAGO, RAMOS, fecha, usd, usdEntero, type MetodoPago, type Ramo } from "@/lib/dominio";

export const metadata: Metadata = { title: "Pólizas y pagos" };

export default async function PolizasAseguradoraPage({ searchParams }: PageProps<"/aseguradora/polizas">) {
  const user = await requerirAseguradora();
  const { tab } = await searchParams;
  const verPagos = tab === "pagos";

  const [pagos, polizas] = await Promise.all([
    db.pago.findMany({
      where: { estado: "EN_REVISION", poliza: { aseguradoraId: user.aseguradoraId } },
      include: { poliza: { include: { user: { select: { nombre: true, email: true, telefono: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    db.poliza.findMany({
      where: { aseguradoraId: user.aseguradoraId },
      include: { user: { select: { nombre: true, email: true, telefono: true } }, intermediario: { select: { nombre: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  return (
    <>
      <Encabezado titulo="Pólizas y pagos" descripcion="Verifica los pagos reportados para activar o renovar pólizas." />
      <div className="mb-6 flex gap-2">
        <Pestana href="/aseguradora/polizas" activa={!verPagos}>Pólizas ({polizas.length})</Pestana>
        <Pestana href="/aseguradora/polizas?tab=pagos" activa={verPagos}>
          Pagos por verificar {pagos.length > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 text-xs text-white">{pagos.length}</span>}
        </Pestana>
      </div>

      {verPagos ? (
        pagos.length === 0 ? (
          <Vacio icono="✅" titulo="No hay pagos pendientes de verificación" />
        ) : (
          <div className="space-y-4">
            {pagos.map((p) => (
              <Tarjeta key={p.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold">{usd(p.montoCents)}</div>
                    <p className="text-sm text-slate-600">
                      {METODOS_PAGO[p.metodo as MetodoPago]} · {p.banco} · ref. <b>{p.referencia}</b> · {fecha(p.fechaPago)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Póliza {p.poliza.numero} · {RAMOS[p.poliza.ramo as Ramo].nombre} · {p.poliza.user.nombre} ({p.poliza.user.telefono ?? p.poliza.user.email})
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:w-80">
                    <form action={verificarPago.bind(null, p.id, true)}>
                      <BotonEnviar bloque pendiente="Confirmando…">✓ Confirmar pago</BotonEnviar>
                    </form>
                    <form action={verificarPago.bind(null, p.id, false)} className="flex gap-2">
                      <Input name="nota" placeholder="Motivo del rechazo" className="py-2 text-sm" />
                      <BotonEnviar variante="borde" pendiente="…">Rechazar</BotonEnviar>
                    </form>
                  </div>
                </div>
              </Tarjeta>
            ))}
          </div>
        )
      ) : polizas.length === 0 ? (
        <Vacio icono="🛡️" titulo="Aún no tienes pólizas emitidas" />
      ) : (
        <Tarjeta className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Póliza</th>
                <th className="px-4 py-3">Asegurado</th>
                <th className="px-4 py-3">Intermediario</th>
                <th className="px-4 py-3">Cobertura</th>
                <th className="px-4 py-3">Prima</th>
                <th className="px-4 py-3">Pagada hasta</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {polizas.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.numero}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.user.nombre}</div>
                    <div className="text-xs text-slate-500">{p.user.email} · {p.user.telefono}</div>
                  </td>
                  <td className="px-4 py-3">{p.intermediario.nombre}</td>
                  <td className="px-4 py-3">{RAMOS[p.ramo as Ramo].nombre}<div className="text-xs text-slate-500">hasta {usdEntero(p.sumaAseguradaUsd)}</div></td>
                  <td className="px-4 py-3">{usd(p.primaCents)}</td>
                  <td className="px-4 py-3">{p.pagadaHasta ? fecha(p.pagadaHasta) : "—"}</td>
                  <td className="px-4 py-3"><BadgeEstado estado={p.estado} mapa={ESTADO_POLIZA} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tarjeta>
      )}
    </>
  );
}

function Pestana({ href, activa, children }: { href: string; activa: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} className={cx("rounded-xl px-4 py-2 text-sm font-semibold", activa ? "bg-marca-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100")}>
      {children}
    </Link>
  );
}
