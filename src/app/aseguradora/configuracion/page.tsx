import type { Metadata } from "next";
import { BadgeEstado, Encabezado } from "@/components/ui";
import { requerirAseguradora } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_ASEGURADORA } from "@/lib/dominio";
import { FormularioConfiguracion } from "./formulario";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  const user = await requerirAseguradora();
  const a = await db.aseguradora.findUniqueOrThrow({ where: { id: user.aseguradoraId } });
  return (
    <>
      <Encabezado
        titulo="Configuración"
        descripcion={`${a.nombre} · RIF ${a.rif}`}
        accion={<BadgeEstado estado={a.estado} mapa={ESTADO_ASEGURADORA} />}
      />
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
