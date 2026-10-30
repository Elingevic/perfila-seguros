"use client";

import { useActionState, useState } from "react";
import { enviarOferta } from "@/actions/aseguradora";
import { BotonEnviar } from "@/components/boton-enviar";
import { Campo, Input, Textarea } from "@/components/ui";
import { PRODUCTOS, type Producto } from "@/lib/dominio";

type Props = {
  solicitudId: string;
  producto: Producto;
  sugerida: number;
  sumaSugerida: number;
  actual?: { primaCents: number; sumaAseguradaUsd: number; resumen: string; exclusiones: string };
};

export function FormularioOferta({ solicitudId, producto, sugerida, sumaSugerida, actual }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [estado, accion] = useActionState(enviarOferta, undefined);
  const e = estado?.errores;

  if (!abierto) {
    return (
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-xs text-slate-500">Prima referencial ~${sugerida.toFixed(2)}</span>
        <button onClick={() => setAbierto(true)} className="font-semibold text-marca-600 hover:underline">
          {actual ? "Mejorar oferta" : "Enviar oferta"}
        </button>
      </div>
    );
  }

  return (
    <form action={accion} className="mt-3 space-y-3">
      {estado?.mensaje && (
        <p className={estado.ok ? "text-sm font-medium text-green-700" : "text-sm font-medium text-red-600"}>{estado.mensaje}</p>
      )}
      <input type="hidden" name="solicitudId" value={solicitudId} />
      <input type="hidden" name="producto" value={producto} />
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
        <Textarea name="resumen" className="min-h-16 text-sm" required
          defaultValue={actual?.resumen ?? `${PRODUCTOS[producto].descripcion} `} />
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
