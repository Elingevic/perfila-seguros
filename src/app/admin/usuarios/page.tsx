import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { cambiarActivoUsuario } from "@/actions/admin";
import { BotonEnviar } from "@/components/boton-enviar";
import { Badge, Encabezado, Input, Tarjeta } from "@/components/ui";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { fecha } from "@/lib/dominio";

export const metadata: Metadata = { title: "Usuarios" };
const POR_PAGINA = 50;

export default async function UsuariosAdminPage({ searchParams }: PageProps<"/admin/usuarios">) {
  const admin = await requerirRol("ADMIN");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const pagina = Math.max(1, Number(sp.pagina) || 1);

  const where: Prisma.UserWhereInput = q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { nombre: { contains: q, mode: "insensitive" } }] } : {};
  const [total, usuarios] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * POR_PAGINA,
      take: POR_PAGINA,
      include: { aseguradora: { select: { nombre: true } }, _count: { select: { polizas: true } } },
    }),
  ]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  return (
    <>
      <Encabezado titulo="Usuarios" descripcion={`${total} usuario(s).`} />
      <form className="mb-4 flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre o correo" className="max-w-sm" />
        <button className="rounded-xl bg-marca-900 px-4 text-sm font-semibold text-white">Buscar</button>
      </form>
      <Tarjeta className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Pólizas</th>
              <th className="px-4 py-3">Registro</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{u.nombre}</div>
                  <div className="text-xs text-slate-500">{u.email} · {u.telefono}</div>
                </td>
                <td className="px-4 py-3">{u.rol === "ASEGURADORA" ? `Aseguradora (${u.aseguradora?.nombre})` : u.rol === "ADMIN" ? "Admin" : "Persona"}</td>
                <td className="px-4 py-3">{u._count.polizas}</td>
                <td className="px-4 py-3 text-slate-500">{fecha(u.createdAt)}</td>
                <td className="px-4 py-3">{u.activo ? <Badge tono="green">Activo</Badge> : <Badge tono="gray">Inactivo</Badge>}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== admin.id && (
                    <form action={cambiarActivoUsuario.bind(null, u.id, !u.activo)}>
                      <BotonEnviar variante="fantasma" tamano="sm" pendiente="…">{u.activo ? "Desactivar" : "Activar"}</BotonEnviar>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tarjeta>
      {paginas > 1 && (
        <div className="mt-4 flex justify-center gap-4 text-sm">
          {pagina > 1 && <Link className="font-semibold text-marca-600" href={`?q=${encodeURIComponent(q)}&pagina=${pagina - 1}`}>‹ Anterior</Link>}
          <span className="text-slate-500">Página {pagina} de {paginas}</span>
          {pagina < paginas && <Link className="font-semibold text-marca-600" href={`?q=${encodeURIComponent(q)}&pagina=${pagina + 1}`}>Siguiente ›</Link>}
        </div>
      )}
    </>
  );
}
