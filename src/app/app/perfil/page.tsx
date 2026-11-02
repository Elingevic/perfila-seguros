import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cerrarSolicitud } from "@/actions/persona";
import { BotonEnviar } from "@/components/boton-enviar";
import { Badge, BotonLink, Encabezado, Tarjeta } from "@/components/ui";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  OCUPACIONES, RAMOS, SALUD, VEHICULOS, edadDesde, parseRamos, vigenciaSolicitud,
  type Ocupacion, type Salud, type Vehiculo,
} from "@/lib/dominio";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function PerfilPage() {
  const user = await requerirRol("PERSONA");
  const perfil = await db.perfil.findUnique({
    where: { userId: user.id },
    include: { solicitudes: { where: { estado: "ABIERTA" }, take: 1 } },
  });
  if (!perfil) redirect("/app/perfil/crear");

  const solicitud = perfil.solicitudes[0];
  const datos: [string, string][] = [
    ["Edad", `${edadDesde(perfil.fechaNacimiento)} años`],
    ["Estado", perfil.estadoResidencia],
    ["Ocupación", OCUPACIONES[perfil.ocupacion as Ocupacion]],
    ["Vehículo", VEHICULOS[perfil.vehiculo as Vehiculo]],
    ["Dependientes", perfil.dependientes === 0 ? "Ninguno" : String(perfil.dependientes)],
    ["Salud", SALUD[perfil.salud as Salud]],
    ["Presupuesto", `$${perfil.presupuestoUsd}/mes`],
  ];

  return (
    <>
      <Encabezado
        titulo="Mi perfil asegurador"
        descripcion="Este perfil te pertenece: si cambias de trabajo, te sigue a donde vayas."
        accion={<BotonLink href="/app/perfil/crear" variante="borde">Editar perfil</BotonLink>}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-marca-600 to-marca-500 text-2xl font-bold text-white">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{user.nombre}</h2>
              <p className="text-sm text-slate-500">Código público: <b>#{perfil.codigo}</b></p>
            </div>
          </div>
          <dl className="divide-y divide-slate-100">
            {datos.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5 text-sm">
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta>
            <div className="flex items-start justify-between">
              <h2 className="font-semibold">Publicación</h2>
              {solicitud ? <Badge tono="green">● Recibiendo ofertas</Badge> : <Badge tono="gray">No publicado</Badge>}
            </div>
            {solicitud ? (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  Los corredores y agentes pueden enviarte ofertas <b>{vigenciaSolicitud(solicitud.expiraAt)}</b> para:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {parseRamos(solicitud.ramos).map((p) => (
                    <Badge key={p}>{RAMOS[p].icono} {RAMOS[p].nombre}</Badge>
                  ))}
                </div>
                <form action={cerrarSolicitud.bind(null, solicitud.id)} className="mt-5">
                  <BotonEnviar variante="borde" pendiente="Retirando…">Dejar de recibir ofertas</BotonEnviar>
                </form>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-slate-600">Publica tu perfil para que corredores y agentes te envíen ofertas.</p>
                <BotonLink href="/app/perfil/crear" className="mt-4">Publicar perfil</BotonLink>
              </>
            )}
          </Tarjeta>
          <Tarjeta className="bg-marca-50/50">
            <h2 className="font-semibold">🔒 ¿Qué ven los intermediarios?</h2>
            <p className="mt-2 text-sm text-slate-600">
              Solo tu código, edad, estado, ocupación, vehículo, número de dependientes, presupuesto y las coberturas que buscas.
              Tu nombre, correo y teléfono solo se comparten con el intermediario y la empresa de la oferta que aceptes.
            </p>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
