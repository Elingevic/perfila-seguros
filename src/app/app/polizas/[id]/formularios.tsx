"use client";

import { useActionState } from "react";
import { reportarPago, reportarSiniestro } from "@/actions/persona";
import { BotonEnviar } from "@/components/boton-enviar";
import { Alerta, Campo, Input, Select, Textarea } from "@/components/ui";
import { BANCOS, METODOS_PAGO } from "@/lib/dominio";

// Fecha local del navegador (no UTC) para el valor por defecto y el máximo
const hoy = () => new Date().toLocaleDateString("en-CA");

export function FormularioPago({ polizaId }: { polizaId: string }) {
  const [estado, accion] = useActionState(reportarPago, undefined);
  const e = estado?.errores;
  if (estado?.ok) return <Alerta tono="green">{estado.mensaje}</Alerta>;
  return (
    <form action={accion} className="space-y-4">
      {estado?.mensaje && <Alerta>{estado.mensaje}</Alerta>}
      <input type="hidden" name="polizaId" value={polizaId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Método" error={e?.metodo}>
          <Select name="metodo" defaultValue="PAGO_MOVIL">
            {Object.entries(METODOS_PAGO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Banco de origen" error={e?.banco}>
          <Select name="banco" defaultValue="" required>
            <option value="" disabled>Selecciona…</option>
            {BANCOS.map((b) => <option key={b}>{b}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Número de referencia" error={e?.referencia}>
          <Input name="referencia" inputMode="numeric" placeholder="Ej. 004512" required />
        </Campo>
        <Campo etiqueta="Fecha del pago" error={e?.fechaPago}>
          <Input name="fechaPago" type="date" defaultValue={hoy()} max={hoy()} required />
        </Campo>
      </div>
      <BotonEnviar pendiente="Enviando…">Reportar pago</BotonEnviar>
    </form>
  );
}

export function FormularioSiniestro({ polizaId }: { polizaId: string }) {
  const [estado, accion] = useActionState(reportarSiniestro, undefined);
  const e = estado?.errores;
  if (estado?.ok) return <Alerta tono="green">{estado.mensaje}</Alerta>;
  return (
    <form action={accion} className="space-y-4">
      {estado?.mensaje && <Alerta>{estado.mensaje}</Alerta>}
      <input type="hidden" name="polizaId" value={polizaId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="¿Cuándo ocurrió?" error={e?.fechaOcurrencia}>
          <Input name="fechaOcurrencia" type="date" max={hoy()} required />
        </Campo>
        <Campo etiqueta="Monto que reclamas (USD)" error={e?.montoReclamadoUsd}>
          <Input name="montoReclamadoUsd" type="number" min={1} step="0.01" required />
        </Campo>
      </div>
      <Campo etiqueta="¿Qué pasó?" error={e?.descripcion} ayuda="Incluye lugar, hora y cómo ocurrió. La aseguradora puede pedirte facturas o informes.">
        <Textarea name="descripcion" required minLength={20} />
      </Campo>
      <BotonEnviar variante="peligro" pendiente="Enviando…">Enviar reporte</BotonEnviar>
    </form>
  );
}
