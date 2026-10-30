import type { Metadata } from "next";
import { FormularioAseguradora } from "./formulario";

export const metadata: Metadata = { title: "Registro de empresas" };

export default function RegistroAseguradoraPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Registra tu empresa</h1>
      <p className="mb-8 mt-2 text-slate-600">
        Empresas de seguros, medicina prepagada, administradoras de riesgo y cooperativas. Tus intermediarios ofrecerán tus productos a clientes que hoy no llegan a tu canal tradicional. Verificamos cada empresa antes de activarla.
      </p>
      <FormularioAseguradora />
    </>
  );
}
