import type { Metadata } from "next";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { parseProductos } from "@/lib/dominio";
import { Asistente } from "./asistente";

export const metadata: Metadata = { title: "Tu perfil asegurador" };

export default async function CrearPerfilPage() {
  const user = await requerirRol("PERSONA");
  const perfil = await db.perfil.findUnique({
    where: { userId: user.id },
    include: { solicitudes: { where: { estado: "ABIERTA" }, take: 1 } },
  });

  const inicial = perfil
    ? {
        fechaNacimiento: perfil.fechaNacimiento.toISOString().slice(0, 10),
        estadoResidencia: perfil.estadoResidencia,
        ocupacion: perfil.ocupacion,
        vehiculo: perfil.vehiculo,
        dependientes: perfil.dependientes,
        salud: perfil.salud,
        presupuestoUsd: perfil.presupuestoUsd,
        productos: perfil.solicitudes[0] ? parseProductos(perfil.solicitudes[0].productos) : undefined,
      }
    : undefined;

  return <Asistente inicial={inicial} nombre={user.nombre} />;
}
