"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ingresar } from "@/actions/auth";
import { BotonEnviar } from "@/components/boton-enviar";
import { Alerta, Campo, Input } from "@/components/ui";

export function FormularioIngreso({ siguiente }: { siguiente?: string }) {
  const [estado, accion] = useActionState(ingresar, undefined);
  return (
    <form action={accion} className="space-y-4">
      {estado?.mensaje && <Alerta>{estado.mensaje}</Alerta>}
      <input type="hidden" name="siguiente" value={siguiente ?? ""} />
      <Campo etiqueta="Correo" error={estado?.errores?.email}>
        <Input name="email" type="email" autoComplete="email" required />
      </Campo>
      <Campo etiqueta="Contraseña" error={estado?.errores?.password}>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Campo>
      <BotonEnviar bloque tamano="lg" pendiente="Ingresando…">Ingresar</BotonEnviar>
      <p className="text-center text-sm text-slate-600">
        ¿No tienes cuenta? <Link href="/registro" className="font-semibold text-marca-600">Regístrate gratis</Link>
      </p>
    </form>
  );
}
