"use client";

import { Boton, BotonLink } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl">😕</div>
      <h1 className="mt-4 text-2xl font-bold">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-slate-600">
        {error.message && !error.digest ? error.message : "Ocurrió un error inesperado. Intenta de nuevo en unos segundos."}
      </p>
      <div className="mt-6 flex gap-3">
        <Boton onClick={reset}>Reintentar</Boton>
        <BotonLink href="/" variante="borde">Ir al inicio</BotonLink>
      </div>
    </div>
  );
}
