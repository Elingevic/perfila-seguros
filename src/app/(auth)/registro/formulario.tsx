"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarPersona } from "@/actions/auth";
import { BotonEnviar } from "@/components/boton-enviar";
import { Alerta, Campo, Input } from "@/components/ui";

export function FormularioRegistro() {
  const [estado, accion] = useActionState(registrarPersona, undefined);
  const e = estado?.errores;
  return (
    <form action={accion} className="space-y-4">
      {estado?.mensaje && <Alerta>{estado.mensaje}</Alerta>}
      <Campo etiqueta="Nombre" error={e?.nombre}>
        <Input name="nombre" autoComplete="given-name" required />
      </Campo>
      <Campo etiqueta="Correo" error={e?.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Campo>
      <Campo etiqueta="Teléfono" error={e?.telefono} ayuda="Para avisarte de nuevas ofertas.">
        <Input name="telefono" type="tel" placeholder="04141234567" autoComplete="tel" required />
      </Campo>
      <Campo etiqueta="Contraseña" error={e?.password} ayuda="Mínimo 8 caracteres, con letras y números.">
        <Input name="password" type="password" autoComplete="new-password" required />
      </Campo>
      <label className="flex items-start gap-3 text-sm text-slate-600">
        <input type="checkbox" name="terminos" className="mt-1 size-4 accent-marca-600" required />
        <span>
          Acepto los <Link href="/terminos" className="font-semibold text-marca-600" target="_blank">términos</Link> y la{" "}
          <Link href="/privacidad" className="font-semibold text-marca-600" target="_blank">política de privacidad</Link>.
        </span>
      </label>
      {e?.terminos && <p className="text-xs font-medium text-red-600">{e.terminos[0]}</p>}
      <BotonEnviar bloque tamano="lg" pendiente="Creando tu cuenta…">Crear cuenta gratis</BotonEnviar>
      <p className="text-center text-sm text-slate-600">
        ¿Ya tienes cuenta? <Link href="/ingresar" className="font-semibold text-marca-600">Ingresa</Link>
      </p>
    </form>
  );
}
