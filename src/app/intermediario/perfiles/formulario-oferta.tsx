"use client";

import { useActionState, useState } from "react";
import { enviarOferta } from "@/actions/intermediario";
import { BotonEnviar } from "@/components/boton-enviar";
import { Campo, Input, Select, Textarea } from "@/components/ui";
import { RAMOS, type Ramo } from "@/lib/dominio";

type OfertaActual = { primaCents: number; sumaAseguradaUsd: number; resumen: string; exclusiones: string };
export type EmpresaOpcion = { id: string; nombre: string; codigo: string; nombreRamo: string; actual?: OfertaActual };

type Props = {
  solicitudId: string;
  ramo: Ramo;
  empresas: EmpresaOpcion[];
  sugerida: number;
  sumaSugerida: number;
};

export function FormularioOferta({ solicitudId, ramo, empresas, sugerida, sumaSugerida }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [empresaId, setEmpresaId] = useState(empresas[0].id);
  const [estado, accion] = useActionState(enviarOferta, undefined);
  const e = estado?.errores;
  const empresa = empresas.find((x) => x.id === empresaId) ?? empresas[0];
  const actual = empresa.actual;

  if (!abierto) {
    return (
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-xs text-slate-500">Prima referencial ~${sugerida.toFixed(2)}</span>
        <button onClick={() => setAbierto(true)} className="font-semibold text-marca-600 hover:underline">
          {empresas.some((x) => x.actual) ? "Ofertar / mejorar" : "Enviar oferta"}
        </button>
      </div>
    );
  }

  return (
    // key: reinicia los valores por defecto al cambiar de empresa
    <form key={empresa.id} action={accion} className="mt-3 space-y-3">
      {estado?.mensaje && (
        <p className={estado.ok ? "text-sm font-medium text-green-700" : "text-sm font-medium text-red-600"}>{estado.mensaje}</p>
      )}
      <input type="hidden" name="solicitudId" value={solicitudId} />
      <input type="hidden" name="ramo" value={ramo} />
      <Campo etiqueta="Empresa que respalda la oferta" error={e?.aseguradoraId}>
        <Select name="aseguradoraId" value={empresa.id} onChange={(ev) => setEmpresaId(ev.target.value)}>
          {empresas.map((x) => (
            <option key={x.id} value={x.id}>
              {x.nombre} — Ramo {x.codigo} {x.nombreRamo}{x.actual ? " (ya ofertaste)" : ""}
            </option>
          ))}
        </Select>
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo etiqueta="Prima mensual (USD)" error={e?.primaUsd}>
          <Input name="primaUsd" type="number" step="0.01" min="0.5"
            defaultValue={actual ? (actual.primaCents / 100).toFixed(2) : sugerida.toFixed(2)} required />
        </Campo>
        <Campo etiqueta="Suma asegurada (USD)" error={e?.sumaAseguradaUsd}>
          <Input name="sumaAseguradaUsd" type="number" step="100" min="100"
            defaultValue={actual?.sumaAseguradaUsd ?? sumaSugerida} required />
        </Campo>
      </div>
      <Campo etiqueta="Qué cubre (en lenguaje claro)" error={e?.resumen}>
        <Textarea name="resumen" className="min-h-16 text-sm" required defaultValue={actual?.resumen ?? `${RAMOS[ramo].descripcion} `} />
      </Campo>
      <Campo etiqueta="Qué no cubre" error={e?.exclusiones}>
        <Textarea name="exclusiones" className="min-h-16 text-sm" required defaultValue={actual?.exclusiones} />
      </Campo>
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
          Cerrar
        </button>
        <BotonEnviar className="flex-1" tamano="sm" pendiente="Enviando…">{actual ? "Actualizar oferta" : "Enviar oferta"}</BotonEnviar>
      </div>
    </form>
  );
}
