import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-gradient-to-br from-marca-950 to-marca-600 p-12 text-white lg:flex">
        <Link href="/"><Logo claro /></Link>
        <div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Publica tu perfil.<br />Los corredores compiten por ti.
          </h2>
          <p className="mt-4 max-w-md text-marca-100">
            Asegúrate desde $3 al mes, sin oficinas ni papeleo. Tu perfil es anónimo hasta que tú decidas.
          </p>
        </div>
        <p className="text-sm text-marca-200">Ofertas de intermediarios autorizados por la SUDEASEG.</p>
      </aside>
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-block lg:hidden"><Logo /></Link>
          {children}
        </div>
      </main>
    </div>
  );
}
