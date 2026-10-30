"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarAseguradora } from "@/actions/auth";
import { BotonEnviar } from "@/components/boton-enviar";
import { Alerta, Campo, Input } from "@/components/ui";

export function FormularioAseguradora() {
  const [estado, accion] = useActionState(registrarAseguradora, undefined);
  const e = estado?.errores;
  return (
    <form action={accion} className="space-y-4">
      {estado?.mensaje && <Alerta>{estado.mensaje}</Alerta>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Empresa aseguradora" error={e?.empresa}>
          <Input name="empresa" required />
        </Campo>
        <Campo etiqueta="RIF" error={e?.rif}>
          <Input name="rif" placeholder="J-12345678-9" required />
        </Campo>
      </div>
      <Campo etiqueta="Nombre del responsable" error={e?.nombre}>
        <Input name="nombre" autoComplete="name" required />
      </Campo>
      <Campo etiqueta="Correo corporativo" error={e?.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Campo>
      <Campo etiqueta="Teléfono" error={e?.telefono}>
        <Input name="telefono" type="tel" placeholder="04121234567" required />
      </Campo>
      <Campo etiqueta="Contraseña" error={e?.password} ayuda="Mínimo 8 caracteres, con letras y números.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Campo>
      <label className="flex items-start gap-3 text-sm text-slate-600">
        <input type="checkbox" name="terminos" className="mt-1 size-4 accent-marca-600" required />
        <span>
          Declaro que la empresa está autorizada para operar en Venezuela y acepto los{" "}
          <Link href="/terminos" className="font-semibold text-marca-600" target="_blank">términos</Link>.
        </span>
      </label>
      {e?.terminos && <p className="text-xs font-medium text-red-600">{e.terminos[0]}</p>}
      <BotonEnviar bloque tamano="lg" pendiente="Enviando…">Solicitar acceso</BotonEnviar>
    </form>
  );
}
