import Link from "next/link";
import { salir } from "@/actions/auth";
import { db } from "@/lib/db";
import type { UsuarioActual } from "@/lib/dal";
import { RUTA_INICIO } from "@/lib/dominio";
import { NavLinks, type Enlace } from "./nav-links";
import { Logo } from "./ui";

const ENLACES: Record<UsuarioActual["rol"], Enlace[]> = {
  PERSONA: [
    { href: "/app", label: "Inicio", exacto: true },
    { href: "/app/perfil", label: "Mi perfil" },
    { href: "/app/ofertas", label: "Ofertas" },
    { href: "/app/polizas", label: "Mis pólizas" },
  ],
  ASEGURADORA: [
    { href: "/aseguradora", label: "Resumen", exacto: true },
    { href: "/aseguradora/perfiles", label: "Perfiles" },
    { href: "/aseguradora/ofertas", label: "Mis ofertas" },
    { href: "/aseguradora/polizas", label: "Pólizas y pagos" },
    { href: "/aseguradora/siniestros", label: "Siniestros" },
    { href: "/aseguradora/configuracion", label: "Configuración" },
  ],
  ADMIN: [
    { href: "/admin", label: "Resumen", exacto: true },
    { href: "/admin/aseguradoras", label: "Aseguradoras" },
    { href: "/admin/usuarios", label: "Usuarios" },
  ],
};

export async function Shell({ user, children }: { user: UsuarioActual; children: React.ReactNode }) {
  const sinLeer = await db.notificacion.count({ where: { userId: user.id, leida: false } });
  const enlaces = ENLACES[user.rol];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
          <Link href={RUTA_INICIO[user.rol]} className="flex items-center gap-2">
            <Logo />
            {user.rol !== "PERSONA" && (
              <span className="rounded-md bg-marca-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {user.rol === "ADMIN" ? "Admin" : user.aseguradora?.nombre ?? "Aseguradora"}
              </span>
            )}
          </Link>
          <nav className="hidden flex-1 md:block">
            <NavLinks enlaces={enlaces} />
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/notificaciones"
              className="relative rounded-xl p-2 text-slate-600 hover:bg-slate-100"
              aria-label={`Notificaciones${sinLeer ? ` (${sinLeer} sin leer)` : ""}`}
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {sinLeer > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {sinLeer > 9 ? "9+" : sinLeer}
                </span>
              )}
            </Link>
            <div className="hidden text-right text-sm sm:block">
              <div className="font-semibold leading-tight">{user.nombre}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <form action={salir}>
              <button className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Salir</button>
            </form>
          </div>
        </div>
        <nav className="overflow-x-auto border-t border-slate-100 px-4 md:hidden">
          <NavLinks enlaces={enlaces} />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
