"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { solicitarClaveEmergencia, type ResultadoClave } from "@/actions/persona";
import { BotonEnviar } from "./boton-enviar";
import { Alerta, Boton, Campo, Input, Select, Textarea, cx } from "./ui";
import { HORAS_VIGENCIA_CLAVE, PARENTESCOS } from "@/lib/dominio";

export type PolizaConClave = { id: string; numero: string; empresa: string };

type Props = {
  polizas: PolizaConClave[];
  titular: string;
  telefono?: string | null;
  /** Estilo del botón que abre el modal */
  variante?: "destacado" | "normal";
};

export function ModalClaveEmergencia({ polizas, titular, telefono, variante = "destacado" }: Props) {
  const [abierto, setAbierto] = useState(false);
  // Remontar el formulario cada vez que se abre limpia el resultado anterior
  const [apertura, setApertura] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => { setApertura((n) => n + 1); setAbierto(true); }}
        className={cx(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors",
          variante === "destacado"
            ? "bg-red-600 px-5 py-3 text-white shadow-sm hover:bg-red-700"
            : "border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 hover:bg-red-100",
        )}
      >
        🚑 Solicitar clave de emergencia
      </button>
      {abierto && (
        <Dialogo onCerrar={() => setAbierto(false)}>
          <Contenido key={apertura} polizas={polizas} titular={titular} telefono={telefono} onCerrar={() => setAbierto(false)} />
        </Dialogo>
      )}
    </>
  );
}

function Dialogo({ children, onCerrar }: { children: React.ReactNode; onCerrar: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-clave"
        className="animar-aparecer max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        {children}
      </div>
    </div>
  );
}

function Contenido({ polizas, titular, telefono, onCerrar }: Omit<Props, "variante"> & { onCerrar: () => void }) {
  const [estado, accion] = useActionState<ResultadoClave, FormData>(solicitarClaveEmergencia, undefined);
  const e = estado?.errores;

  // Sin póliza de medicina prepagada activa no se puede pedir clave
  if (polizas.length === 0) {
    return (
      <div className="text-center">
        <div className="text-5xl">🚑</div>
        <h2 id="titulo-clave" className="mt-3 text-xl font-bold">Necesitas una póliza de Medicina Prepagada</h2>
        <p className="mt-2 text-slate-600">
          La clave de emergencia está disponible para afiliados con una póliza de <b>Medicina Prepagada</b> activa y al día.
        </p>
        <div className="mt-4 text-left">
          <Alerta tono="amber">
            Si tienes una emergencia ahora, acude al centro de salud más cercano o llama al <b>911</b>.
          </Alerta>
        </div>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Boton variante="borde" onClick={onCerrar} className="sm:flex-1">Cerrar</Boton>
          <Link href="/app/perfil/crear" className="inline-flex items-center justify-center rounded-xl bg-marca-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-marca-700 sm:flex-1">
            Cotizar Medicina Prepagada
          </Link>
        </div>
      </div>
    );
  }

  if (estado?.ok && estado.clave) {
    const c = estado.clave;
    return (
      <div className="text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-600 text-3xl text-white">✓</div>
        <h2 id="titulo-clave" className="mt-3 text-xl font-bold">Clave emitida</h2>
        <p className="mt-1 text-sm text-slate-600">Preséntala en admisión de la clínica junto con tu cédula.</p>
        <div className="my-5 rounded-2xl border-2 border-dashed border-green-500 bg-green-50 p-5">
          <div className="text-xs uppercase tracking-wider text-green-800">Clave de emergencia</div>
          <div className="mt-1 select-all font-mono text-3xl font-extrabold tracking-widest text-green-900">{c.codigo}</div>
          <div className="mt-2 text-sm text-green-900">Válida hasta {c.venceAt}</div>
        </div>
        <dl className="space-y-1 text-left text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Paciente</dt><dd className="font-medium">{c.paciente}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Clínica</dt><dd className="font-medium">{c.clinica}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Empresa</dt><dd className="font-medium">{c.empresa}</dd></div>
        </dl>
        <Boton bloque className="mt-6" onClick={onCerrar}>Listo</Boton>
      </div>
    );
  }

  return (
    <form action={accion} className="space-y-4">
      <div>
        <h2 id="titulo-clave" className="text-xl font-bold">🚑 Clave de emergencia</h2>
        <p className="mt-1 text-sm text-slate-600">
          Se emite al instante y es válida por {HORAS_VIGENCIA_CLAVE} horas. Si la vida del paciente corre peligro, acude primero a la emergencia.
        </p>
      </div>
      {estado?.mensaje && <Alerta>{estado.mensaje}</Alerta>}

      {polizas.length === 1 ? (
        <>
          <input type="hidden" name="polizaId" value={polizas[0].id} />
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm">Póliza <b>{polizas[0].numero}</b> · {polizas[0].empresa}</p>
        </>
      ) : (
        <Campo etiqueta="Póliza" error={e?.polizaId}>
          <Select name="polizaId" defaultValue={polizas[0].id}>
            {polizas.map((p) => <option key={p.id} value={p.id}>{p.numero} · {p.empresa}</option>)}
          </Select>
        </Campo>
      )}

      <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
        <Campo etiqueta="Paciente" error={e?.paciente}>
          <Input name="paciente" defaultValue={titular} required />
        </Campo>
        <Campo etiqueta="Parentesco" error={e?.parentesco}>
          <Select name="parentesco" defaultValue="Titular">
            {PARENTESCOS.map((p) => <option key={p}>{p}</option>)}
          </Select>
        </Campo>
      </div>
      <Campo etiqueta="Clínica o centro de salud" error={e?.clinica}>
        <Input name="clinica" placeholder="Ej. Centro Médico, Valencia" required />
      </Campo>
      <Campo etiqueta="¿Qué está pasando?" error={e?.motivo}>
        <Textarea name="motivo" className="min-h-20" placeholder="Ej. Fiebre alta y dificultad para respirar" required />
      </Campo>
      <Campo etiqueta="Teléfono de contacto" error={e?.telefono}>
        <Input name="telefono" type="tel" defaultValue={telefono ?? ""} placeholder="04141234567" required />
      </Campo>
      <div className="flex gap-2">
        <Boton type="button" variante="borde" onClick={onCerrar}>Cancelar</Boton>
        <BotonEnviar variante="peligro" className="flex-1" pendiente="Emitiendo clave…">Emitir clave ahora</BotonEnviar>
      </div>
    </form>
  );
}
