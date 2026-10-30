import type { Metadata } from "next";
import { FormularioIntermediario } from "./formulario";

export const metadata: Metadata = { title: "Registro de corredores y agentes" };

export default function RegistroIntermediarioPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Corredores, agentes y sociedades de corretaje</h1>
      <p className="mb-8 mt-2 text-slate-600">
        Recibe perfiles de clientes que buscan seguro y ofréceles los productos de las empresas que representas. Verificamos tu
        autorización antes de activarte.
      </p>
      <FormularioIntermediario />
    </>
  );
}
