import type { Metadata } from "next";
import { cambiarEstadoIntermediario } from "@/actions/admin";
import { BotonEnviar } from "@/components/boton-enviar";
import { BadgeEstado, Encabezado, Tarjeta, Vacio } from "@/components/ui";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_REGISTRO, TIPOS_INTERMEDIARIO, fecha, type TipoIntermediario } from "@/lib/dominio";

export const metadata: Metadata = { title: "Intermediarios" };

export default async function IntermediariosAdminPage() {
  await requerirRol("ADMIN");
  const intermediarios = await db.intermediario.findMany({
    include: {
      usuarios: { select: { nombre: true, email: true, telefono: true } },
      vinculos: { where: { estado: "APROBADO" }, include: { aseguradora: { select: { nombre: true } } } },
      _count: { select: { ofertas: true, polizas: true } },
    },
    orderBy: [{ estado: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <Encabezado
        titulo="Intermediarios"
        descripcion="Verifica la autorización SUDEASEG de cada corredor, agente o sociedad de corretaje antes de aprobarlo."
      />
      {intermediarios.length === 0 ? (
        <Vacio icono="🤝" titulo="No hay intermediarios registrados" />
      ) : (
        <div className="space-y-3">
          {intermediarios.map((i) => (
            <Tarjeta key={i.id} className="flex flex-wrap items-center gap-4">
              <div className="min-w-60 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{i.nombre}</h3>
                  <BadgeEstado estado={i.estado} mapa={ESTADO_REGISTRO} />
                </div>
                <p className="text-xs text-slate-500">
                  {TIPOS_INTERMEDIARIO[i.tipo as TipoIntermediario].nombre} · {i.documento} · Autorización {i.numeroAutorizacion} ·
                  registrado el {fecha(i.createdAt)} · {i._count.ofertas} ofertas · {i._count.polizas} pólizas
                </p>
                <p className="text-xs text-slate-500">
                  Representa a: {i.vinculos.length ? i.vinculos.map((v) => v.aseguradora.nombre).join(", ") : "ninguna empresa aún"}
                </p>
                <p className="text-xs text-slate-500">{i.usuarios.map((u) => `${u.nombre} (${u.email}, ${u.telefono ?? "s/t"})`).join(" · ")}</p>
              </div>
              <div className="flex gap-2">
                {i.estado !== "APROBADA" && (
                  <form action={cambiarEstadoIntermediario.bind(null, i.id, "APROBADA")}>
                    <BotonEnviar tamano="sm" pendiente="…">Verificar</BotonEnviar>
                  </form>
                )}
                {i.estado !== "SUSPENDIDA" && (
                  <form action={cambiarEstadoIntermediario.bind(null, i.id, "SUSPENDIDA")}>
                    <BotonEnviar tamano="sm" variante="borde" pendiente="…">Suspender</BotonEnviar>
                  </form>
                )}
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
    </>
  );
}
