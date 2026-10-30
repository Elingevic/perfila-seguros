import type { Metadata } from "next";
import { cambiarEstadoAseguradora } from "@/actions/admin";
import { BotonEnviar } from "@/components/boton-enviar";
import { BadgeEstado, Encabezado, LogoAseguradora, Tarjeta, Vacio } from "@/components/ui";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_ASEGURADORA, TIPOS_EMPRESA, fecha, type TipoEmpresa } from "@/lib/dominio";

export const metadata: Metadata = { title: "Empresas" };

export default async function AseguradorasAdminPage() {
  await requerirRol("ADMIN");
  const aseguradoras = await db.aseguradora.findMany({
    include: {
      usuarios: { select: { nombre: true, email: true, telefono: true } },
      _count: { select: { ofertas: true, polizas: true } },
    },
    orderBy: [{ estado: "desc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <Encabezado titulo="Empresas" descripcion="Verifica que cada empresa esté autorizada por la SUDEASEG antes de aprobarla." />
      {aseguradoras.length === 0 ? (
        <Vacio icono="🏢" titulo="No hay empresas registradas" />
      ) : (
        <div className="space-y-4">
          {aseguradoras.map((a) => (
            <Tarjeta key={a.id} className="flex flex-wrap items-center gap-4">
              <LogoAseguradora sigla={a.sigla} color={a.color} />
              <div className="min-w-60 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{a.nombre}</h3>
                  <BadgeEstado estado={a.estado} mapa={ESTADO_ASEGURADORA} />
                </div>
                <p className="text-xs text-slate-500">
                  {TIPOS_EMPRESA[a.tipo as TipoEmpresa]?.nombre} · RIF {a.rif} · registrada el {fecha(a.createdAt)} · {a._count.ofertas} ofertas · {a._count.polizas} pólizas
                </p>
                <p className="text-xs text-slate-500">
                  {a.usuarios.map((u) => `${u.nombre} (${u.email}, ${u.telefono ?? "s/t"})`).join(" · ")}
                </p>
              </div>
              <div className="flex gap-2">
                {a.estado !== "APROBADA" && (
                  <form action={cambiarEstadoAseguradora.bind(null, a.id, "APROBADA")}>
                    <BotonEnviar tamano="sm" pendiente="…">Aprobar</BotonEnviar>
                  </form>
                )}
                {a.estado !== "SUSPENDIDA" && (
                  <form action={cambiarEstadoAseguradora.bind(null, a.id, "SUSPENDIDA")}>
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
