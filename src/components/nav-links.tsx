"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

export type Enlace = { href: string; label: string; exacto?: boolean };

export function NavLinks({ enlaces }: { enlaces: Enlace[] }) {
  const ruta = usePathname();
  return (
    <ul className="flex gap-1 whitespace-nowrap py-2 md:py-0">
      {enlaces.map((e) => {
        const activo = e.exacto ? ruta === e.href : ruta === e.href || ruta.startsWith(e.href + "/");
        return (
          <li key={e.href}>
            <Link
              href={e.href}
              className={cx(
                "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activo ? "bg-marca-50 text-marca-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {e.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
