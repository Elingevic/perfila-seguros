import type { Metadata } from "next";
import { FormularioAseguradora } from "./formulario";

export const metadata: Metadata = { title: "Registro de aseguradoras" };

export default function RegistroAseguradoraPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Registra tu aseguradora</h1>
      <p className="mb-8 mt-2 text-slate-600">
        Accede a perfiles de clientes nuevos que hoy no llegan a tu canal tradicional. Verificamos cada empresa antes de activarla.
      </p>
      <FormularioAseguradora />
    </>
  );
}
