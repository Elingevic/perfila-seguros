import type { Metadata } from "next";
import { FormularioIngreso } from "./formulario";

export const metadata: Metadata = { title: "Ingresar" };

export default async function IngresarPage({ searchParams }: PageProps<"/ingresar">) {
  const { siguiente } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Bienvenido de vuelta</h1>
      <p className="mb-8 mt-2 text-slate-600">Ingresa para ver tus ofertas y pólizas.</p>
      <FormularioIngreso siguiente={typeof siguiente === "string" ? siguiente : undefined} />
    </>
  );
}
