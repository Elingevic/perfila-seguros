import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRegistro } from "./formulario";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Crea tu cuenta</h1>
      <p className="mb-8 mt-2 text-slate-600">Luego armamos tu perfil asegurador en 2 minutos.</p>
      <FormularioRegistro />
      <div className="mt-8 space-y-1 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
        <p>
          ¿Eres corredor o agente?{" "}
          <Link href="/registro/intermediario" className="font-semibold text-marca-600">Regístrate como intermediario</Link>
        </p>
        <p>
          ¿Representas a una empresa?{" "}
          <Link href="/registro/aseguradora" className="font-semibold text-marca-600">Registra tu empresa</Link>
        </p>
      </div>
    </>
  );
}
