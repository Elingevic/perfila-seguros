import Link from "next/link";
import { Logo } from "./ui";

export function PiePagina() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500">
        <div className="flex items-center gap-3">
          <Logo />
          <span>© {new Date().getFullYear()} Perfila</span>
        </div>
        <nav className="flex gap-6">
          <Link href="/terminos" className="hover:text-slate-900">Términos</Link>
          <Link href="/privacidad" className="hover:text-slate-900">Privacidad</Link>
          <Link href="/registro/aseguradora" className="hover:text-slate-900">Aseguradoras</Link>
        </nav>
        <p className="w-full text-xs">
          Perfila es una plataforma tecnológica. La contratación de pólizas se realiza con aseguradoras autorizadas y a través de
          intermediarios habilitados conforme a la normativa vigente en Venezuela.
        </p>
      </div>
    </footer>
  );
}
