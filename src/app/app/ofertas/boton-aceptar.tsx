"use client";

import { useState, useTransition } from "react";
import { aceptarOferta } from "@/actions/persona";
import { Boton } from "@/components/ui";

export function BotonAceptar({ ofertaId, intermediario, aseguradora, prima }: { ofertaId: string; intermediario: string; aseguradora: string; prima: string }) {
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string>();
  const [pendiente, iniciar] = useTransition();

  if (!confirmar) {
    return <Boton bloque onClick={() => setConfirmar(true)}>Elegir esta oferta</Boton>;
  }

  return (
    <div className="rounded-xl bg-marca-50 p-3">
      <p className="text-sm text-marca-900">
        Vas a contratar con <b>{aseguradora}</b> a través de <b>{intermediario}</b> por <b>{prima}/mes</b>. Compartiremos tu nombre y contacto con ambos para emitir la póliza.
      </p>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Boton variante="borde" onClick={() => setConfirmar(false)} disabled={pendiente}>Cancelar</Boton>
        <Boton
          className="flex-1"
          disabled={pendiente}
          onClick={() =>
            iniciar(async () => {
              const r = await aceptarOferta(ofertaId);
              if (r?.error) setError(r.error);
            })
          }
        >
          {pendiente ? "Contratando…" : "Confirmar"}
        </Boton>
      </div>
    </div>
  );
}
