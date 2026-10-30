import type { Metadata } from "next";
import { BadgeEstado, Encabezado, Tarjeta } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_ASEGURADORA, RAMOS, TIPOS_EMPRESA, codigoRamo, ramosDeEmpresa, type TipoEmpresa } from "@/lib/dominio";
import { FormularioConfiguracion } from "./formulario";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const user = await requerirAseguradora();
  const a = await db.aseguradora.findUniqueOrThrow({ where: { id: user.aseguradoraId } });
  return (
    <>
      <Encabezado
        titulo="Configuración"
        descripcion={`${a.nombre} · ${TIPOS_EMPRESA[a.tipo as TipoEmpresa].nombre} · RIF ${a.rif}`}
        accion={<BadgeEstado estado={a.estado} mapa={ESTADO_ASEGURADORA} />}
      />
      <Tarjeta className="mb-6">
        <h2 className="font-semibold">Ramos que puedes ofrecer</h2>
        <p className="text-sm text-slate-500">Según el catálogo de ramos contables para {TIPOS_EMPRESA[a.tipo as TipoEmpresa].nombre}.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ramosDeEmpresa(a.tipo as TipoEmpresa).map((r) => {
            const c = codigoRamo(r, a.tipo as TipoEmpresa)!;
            return (
              <span key={r} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                <b>{c.codigo}</b> · {c.nombre} {RAMOS[r].icono}
              </span>
            );
          })}
        </div>
      </Tarjeta>
      <FormularioConfiguracion
        inicial={{
          descripcion: a.descripcion ?? "",
          color: a.color,
          sigla: a.sigla,
          siniestrosPagadosPct: a.siniestrosPagadosPct ?? "",
          diasPromedioPago: a.diasPromedioPago ?? "",
          pagoMovilBanco: a.pagoMovilBanco ?? "",
          pagoMovilTelefono: a.pagoMovilTelefono ?? "",
          cuentaBancaria: a.cuentaBancaria ?? "",
        }}
      />
    </>
  );
}
