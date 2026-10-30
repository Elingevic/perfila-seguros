import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { Encabezado, Tarjeta, Vacio, cx } from "@/components/ui";
import { usuarioActual } from "@/lib/dal";
import { db } from "@/lib/db";
import { haceCuanto } from "@/lib/dominio";

export const metadata: Metadata = { title: "Notificaciones" };

async function marcarTodasLeidas() {
  "use server";
  const user = await usuarioActual();
  if (!user) return;
  await db.notificacion.updateMany({ where: { userId: user.id, leida: false }, data: { leida: true } });
  revalidatePath("/", "layout");
}

export default async function NotificacionesPage() {
  const user = await usuarioActual();
  if (!user) redirect("/ingresar?siguiente=/notificaciones");

  const notificaciones = await db.notificacion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const sinLeer = notificaciones.some((n) => !n.leida);

  return (
    <Shell user={user}>
      <Encabezado
        titulo="Notificaciones"
        accion={
          sinLeer && (
            <form action={marcarTodasLeidas}>
              <button className="text-sm font-semibold text-marca-600 hover:underline">Marcar todas como leídas</button>
            </form>
          )
        }
      />
      {notificaciones.length === 0 ? (
        <Vacio icono="🔔" titulo="No tienes notificaciones" />
      ) : (
        <Tarjeta className="divide-y divide-slate-100 p-0">
          {notificaciones.map((n) => {
            const contenido = (
              <div className={cx("flex gap-3 px-5 py-4", !n.leida && "bg-marca-50/50")}>
                <span className={cx("mt-1.5 size-2 shrink-0 rounded-full", n.leida ? "bg-transparent" : "bg-marca-600")} />
                <div className="flex-1">
                  <div className="font-medium">{n.titulo}</div>
                  <p className="text-sm text-slate-600">{n.mensaje}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{haceCuanto(n.createdAt)}</span>
              </div>
            );
            return n.link ? (
              <Link key={n.id} href={n.link} className="block hover:bg-slate-50">{contenido}</Link>
            ) : (
              <div key={n.id}>{contenido}</div>
            );
          })}
        </Tarjeta>
      )}
    </Shell>
  );
}
