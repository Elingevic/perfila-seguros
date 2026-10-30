"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarIntermediario } from "@/actions/auth";
import { BotonEnviar } from "@/components/boton-enviar";
import { Alerta, Campo, Input, Select } from "@/components/ui";
import { TIPOS_INTERMEDIARIO } from "@/lib/dominio";

export function FormularioIntermediario() {
  const [estado, accion] = useActionState(registrarIntermediario, undefined);
  const e = estado?.errores;
  return (
    <form action={accion} className="space-y-4">
      {estado?.mensaje && <Alerta>{estado.mensaje}</Alerta>}
      <Campo etiqueta="Tipo de intermediario" error={e?.tipo}>
        <Select name="tipo" defaultValue="" required>
          <option value="" disabled>Selecciona…</option>
          {Object.entries(TIPOS_INTERMEDIARIO).map(([k, v]) => <option key={k} value={k}>{v.nombre}</option>)}
        </Select>
      </Campo>
      <Campo etiqueta="Nombre o razón social" error={e?.razonSocial} ayuda="Tal como aparece en tu autorización.">
        <Input name="razonSocial" required />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Cédula o RIF" error={e?.documento}>
          <Input name="documento" placeholder="V-12345678 o J-12345678-9" required />
        </Campo>
        <Campo etiqueta="N.° de autorización SUDEASEG" error={e?.numeroAutorizacion}>
          <Input name="numeroAutorizacion" placeholder="Ej. CS-12873" required />
        </Campo>
      </div>
      <Campo etiqueta="Persona de contacto" error={e?.nombre}>
        <Input name="nombre" autoComplete="name" required />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Correo" error={e?.email}>
          <Input name="email" type="email" autoComplete="email" required />
        </Campo>
        <Campo etiqueta="Teléfono" error={e?.telefono}>
          <Input name="telefono" type="tel" placeholder="04141234567" required />
        </Campo>
      </div>
      <Campo etiqueta="Contraseña" error={e?.password} ayuda="Mínimo 8 caracteres, con letras y números.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Campo>
      <label className="flex items-start gap-3 text-sm text-slate-600">
        <input type="checkbox" name="terminos" className="mt-1 size-4 accent-marca-600" required />
        <span>
          Declaro que cuento con autorización vigente de la SUDEASEG para actuar como intermediario y acepto los{" "}
          <Link href="/terminos" className="font-semibold text-marca-600" target="_blank">términos</Link>.
        </span>
      </label>
      {e?.terminos && <p className="text-xs font-medium text-red-600">{e.terminos[0]}</p>}
      <BotonEnviar bloque tamano="lg" pendiente="Enviando…">Registrarme como intermediario</BotonEnviar>
    </form>
  );
}
