import type { Metadata } from "next";
import { solicitarVinculo } from "@/actions/intermediario";
import { BotonEnviar } from "@/components/boton-enviar";
import { BadgeEstado, Encabezado, LogoAseguradora, Tarjeta, Vacio } from "@/components/ui";
import { requerirIntermediario } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  ESTADO_VINCULO, RAMOS, TIPOS_EMPRESA, TIPOS_INTERMEDIARIO, codigoRamo, puedeRepresentar, ramosDeEmpresa,
  type TipoEmpresa, type TipoIntermediario,
} from "@/lib/dominio";

export const metadata: Metadata = { title: "Empresas" };

export default async function EmpresasPage() {
  const user = await requerirIntermediario();
  const tipo = user.intermediario.tipo as TipoIntermediario;

  const [empresas, vinculos] = await Promise.all([
    db.aseguradora.findMany({ where: { estado: "APROBADA" }, orderBy: { nombre: "asc" } }),
    db.vinculo.findMany({ where: { intermediarioId: user.intermediarioId } }),
  ]);
  const compatibles = empresas.filter((e) => puedeRepresentar(tipo, e.tipo as TipoEmpresa));

  return (
    <>
      <Encabezado
        titulo="Empresas que representas"
        descripcion={`Como ${TIPOS_INTERMEDIARIO[tipo].nombre} puedes vincularte a: ${TIPOS_INTERMEDIARIO[tipo].empresas
          .map((t) => TIPOS_EMPRESA[t].nombre)
          .join(", ")}. Cada empresa aprueba el vínculo.`}
      />
      {compatibles.length === 0 ? (
        <Vacio icono="🏢" titulo="No hay empresas disponibles para tu tipo de intermediario" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {compatibles.map((e) => {
            const v = vinculos.find((x) => x.aseguradoraId === e.id);
            const tipoEmpresa = e.tipo as TipoEmpresa;
            return (
              <Tarjeta key={e.id} className="flex flex-col">
                <div className="flex items-start gap-3">
                  <LogoAseguradora sigla={e.sigla} color={e.color} />
                  <div className="flex-1">
                    <h3 className="font-semibold">{e.nombre}</h3>
                    <p className="text-xs text-slate-500">{TIPOS_EMPRESA[tipoEmpresa].nombre} · RIF {e.rif}</p>
                  </div>
                  {v && <BadgeEstado estado={v.estado} mapa={ESTADO_VINCULO} />}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {ramosDeEmpresa(tipoEmpresa).map((r) => (
                    <span key={r} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                      {codigoRamo(r, tipoEmpresa)!.codigo} · {RAMOS[r].nombre}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-4">
                  {(!v || v.estado === "RECHAZADO") && user.intermediario.estado === "APROBADA" && (
                    <form action={solicitarVinculo.bind(null, e.id)}>
                      <BotonEnviar variante="secundario" bloque pendiente="Enviando…">
                        {v ? "Volver a solicitar vínculo" : "Solicitar vínculo"}
                      </BotonEnviar>
                    </form>
                  )}
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}
    </>
  );
}
