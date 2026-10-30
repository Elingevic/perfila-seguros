import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Botones
// ---------------------------------------------------------------------------
const VARIANTES = {
  primario: "bg-marca-600 text-white hover:bg-marca-700 disabled:bg-slate-400",
  secundario: "bg-marca-50 text-marca-700 hover:bg-marca-100",
  borde: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
  peligro: "bg-red-600 text-white hover:bg-red-700",
  fantasma: "text-slate-600 hover:bg-slate-100",
} as const;
const TAMANOS = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" } as const;

type BotonProps = {
  variante?: keyof typeof VARIANTES;
  tamano?: keyof typeof TAMANOS;
  bloque?: boolean;
};

function claseBoton({ variante = "primario", tamano = "md", bloque }: BotonProps, extra?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed",
    VARIANTES[variante],
    TAMANOS[tamano],
    bloque && "w-full",
    extra,
  );
}

export function Boton({ variante, tamano, bloque, className, ...props }: BotonProps & ComponentProps<"button">) {
  return <button className={claseBoton({ variante, tamano, bloque }, className)} {...props} />;
}

export function BotonLink({ variante, tamano, bloque, className, ...props }: BotonProps & ComponentProps<typeof Link>) {
  return <Link className={claseBoton({ variante, tamano, bloque }, className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Contenedores
// ---------------------------------------------------------------------------
export function Tarjeta({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-slate-200 bg-white p-5", className)} {...props} />;
}

export function Encabezado({ titulo, descripcion, accion }: { titulo: string; descripcion?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-slate-600">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}

export function Vacio({ icono, titulo, children }: { icono: string; titulo: string; children?: ReactNode }) {
  return (
    <Tarjeta className="py-12 text-center">
      <div className="text-4xl">{icono}</div>
      <h3 className="mt-3 font-semibold text-slate-900">{titulo}</h3>
      {children && <div className="mt-2 text-sm text-slate-600">{children}</div>}
    </Tarjeta>
  );
}

export function Kpi({ valor, etiqueta }: { valor: ReactNode; etiqueta: string }) {
  return (
    <Tarjeta className="p-4">
      <div className="text-2xl font-bold text-slate-900">{valor}</div>
      <div className="text-xs text-slate-500">{etiqueta}</div>
    </Tarjeta>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------
const TONOS = {
  blue: "bg-marca-50 text-marca-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-slate-100 text-slate-600",
} as const;
export type Tono = keyof typeof TONOS;

export function Badge({ tono = "blue", children, className }: { tono?: Tono; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", TONOS[tono], className)}>
      {children}
    </span>
  );
}

export function BadgeEstado<K extends string>({
  estado,
  mapa,
}: {
  estado: string;
  mapa: Record<K, { label: string; tono: Tono }>;
}) {
  const e = mapa[estado as K] ?? { label: estado, tono: "gray" as Tono };
  return <Badge tono={e.tono}>{e.label}</Badge>;
}

export function LogoAseguradora({ sigla, color, tamano = 40 }: { sigla: string; color: string; tamano?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl font-bold text-white"
      style={{ background: color, width: tamano, height: tamano, fontSize: tamano * 0.35 }}
    >
      {sigla}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------
const CAMPO = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 outline-none transition focus:border-marca-500 focus:ring-4 focus:ring-marca-100";

export function Campo({
  etiqueta,
  error,
  ayuda,
  children,
}: {
  etiqueta: string;
  error?: string[] | string;
  ayuda?: string;
  children: ReactNode;
}) {
  const msg = Array.isArray(error) ? error[0] : error;
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{etiqueta}</span>
      {children}
      {ayuda && !msg && <span className="mt-1 block text-xs text-slate-500">{ayuda}</span>}
      {msg && <span className="mt-1 block text-xs font-medium text-red-600">{msg}</span>}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(CAMPO, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(CAMPO, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(CAMPO, "min-h-24", className)} {...props} />;
}

export function Alerta({ tono = "red", children }: { tono?: "red" | "green" | "amber" | "blue"; children: ReactNode }) {
  const c = {
    red: "border-red-200 bg-red-50 text-red-800",
    green: "border-green-200 bg-green-50 text-green-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-marca-200 bg-marca-50 text-marca-900",
  }[tono];
  return <div className={cx("rounded-xl border px-4 py-3 text-sm", c)}>{children}</div>;
}

export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className={cx("text-xl font-extrabold tracking-tight", claro ? "text-white" : "text-marca-900")}>
      Perfil<span className={claro ? "text-marca-200" : "text-marca-500"}>a</span>
    </span>
  );
}
