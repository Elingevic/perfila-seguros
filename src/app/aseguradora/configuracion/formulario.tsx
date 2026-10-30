"use client";

import { useActionState } from "react";
import { guardarConfiguracion } from "@/actions/aseguradora";
import { BotonEnviar } from "@/components/boton-enviar";
import { Alerta, Campo, Input, Select, Tarjeta, Textarea } from "@/components/ui";
import { BANCOS } from "@/lib/dominio";

type Inicial = Record<
  "descripcion" | "color" | "sigla" | "pagoMovilBanco" | "pagoMovilTelefono" | "cuentaBancaria",
  string
> & { siniestrosPagadosPct: number | ""; diasPromedioPago: number | "" };

export function FormularioConfiguracion({ inicial }: { inicial: Inicial }) {
  const [estado, accion] = useActionState(guardarConfiguracion, undefined);
  const e = estado?.errores;
  return (
    <form action={accion} className="grid gap-6 lg:grid-cols-2">
      <Tarjeta className="space-y-4">
        <h2 className="font-semibold">Perfil público</h2>
        <p className="text-sm text-slate-500">Lo que ven los usuarios al comparar tus ofertas.</p>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="Sigla (logo)" error={e?.sigla}>
            <Input name="sigla" maxLength={3} defaultValue={inicial.sigla} required />
          </Campo>
          <Campo etiqueta="Color de marca" error={e?.color}>
            <Input name="color" type="color" defaultValue={inicial.color} className="h-11 p-1" />
          </Campo>
        </div>
        <Campo etiqueta="Descripción" error={e?.descripcion}>
          <Textarea name="descripcion" maxLength={400} defaultValue={inicial.descripcion} />
        </Campo>
        <div className="grid grid-cols-2 gap-4">
          <Campo etiqueta="% de siniestros pagados" error={e?.siniestrosPagadosPct} ayuda="Último ejercicio.">
            <Input name="siniestrosPagadosPct" type="number" min={0} max={100} defaultValue={inicial.siniestrosPagadosPct} required />
          </Campo>
          <Campo etiqueta="Días promedio de pago" error={e?.diasPromedioPago}>
            <Input name="diasPromedioPago" type="number" min={0} max={365} defaultValue={inicial.diasPromedioPago} required />
          </Campo>
        </div>
      </Tarjeta>
      <Tarjeta className="h-fit space-y-4">
        <h2 className="font-semibold">Datos de cobro</h2>
        <p className="text-sm text-slate-500">Se muestran al asegurado para que pague su prima.</p>
        <Campo etiqueta="Banco para Pago Móvil" error={e?.pagoMovilBanco}>
          <Select name="pagoMovilBanco" defaultValue={inicial.pagoMovilBanco}>
            <option value="">— No recibir Pago Móvil —</option>
            {BANCOS.map((b) => <option key={b}>{b}</option>)}
          </Select>
        </Campo>
        <Campo etiqueta="Teléfono de Pago Móvil" error={e?.pagoMovilTelefono}>
          <Input name="pagoMovilTelefono" placeholder="04141234567" defaultValue={inicial.pagoMovilTelefono} />
        </Campo>
        <Campo etiqueta="Cuenta bancaria (transferencias)" error={e?.cuentaBancaria}>
          <Input name="cuentaBancaria" placeholder="0102-0000-00-0000000000" defaultValue={inicial.cuentaBancaria} />
        </Campo>
        {estado?.mensaje && <Alerta tono={estado.ok ? "green" : "red"}>{estado.mensaje}</Alerta>}
        <BotonEnviar bloque pendiente="Guardando…">Guardar cambios</BotonEnviar>
      </Tarjeta>
    </form>
  );
}
