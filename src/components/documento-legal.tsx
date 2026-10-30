import Link from "next/link";
import { Logo } from "./ui";
import { PiePagina } from "./pie-pagina";

export function DocumentoLegal({ titulo, actualizado, secciones }: { titulo: string; actualizado: string; secciones: [string, string][] }) {
  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4"><Link href="/"><Logo /></Link></div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: {actualizado}</p>
        <div className="mt-10 space-y-8">
          {secciones.map(([t, c], i) => (
            <section key={t}>
              <h2 className="text-lg font-semibold">{i + 1}. {t}</h2>
              <p className="mt-2 leading-relaxed text-slate-700">{c}</p>
            </section>
          ))}
        </div>
      </main>
      <PiePagina />
    </>
  );
}
