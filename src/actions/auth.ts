"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { borrarSesion, crearSesion } from "@/lib/session";
import { Ingreso, RegistroAseguradora, RegistroIntermediario, RegistroPersona, erroresDe, type EstadoForm } from "@/lib/esquemas";
import { RUTA_INICIO, type Rol } from "@/lib/dominio";

// Hash ficticio para que el tiempo de respuesta no revele si el correo existe.
const HASH_FICTICIO = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.ZiLJ6M2lW0D8xY8ZCwRrQ9b1tSIu";

function rutaSegura(siguiente: FormDataEntryValue | null, rol: Rol) {
  const s = typeof siguiente === "string" ? siguiente : "";
  // Solo rutas internas del área del rol (evita open redirect)
  if (s.startsWith(RUTA_INICIO[rol]) && !s.startsWith("//")) return s;
  return RUTA_INICIO[rol];
}

export async function registrarPersona(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const r = RegistroPersona.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };
  const { nombre, email, telefono, password } = r.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { errores: { email: ["Ya existe una cuenta con este correo."] } };
  }

  const user = await db.user.create({
    data: {
      nombre, email, telefono, rol: "PERSONA",
      passwordHash: await bcrypt.hash(password, 10),
      aceptaTerminosAt: new Date(),
    },
  });
  await crearSesion({ userId: user.id, rol: "PERSONA" });
  redirect("/app/perfil/crear");
}

export async function registrarAseguradora(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const r = RegistroAseguradora.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };
  const { tipo, empresa, rif, nombre, email, telefono, password } = r.data;
  const rifNormal = rif.replace(/^J-?(\d{8})-?(\d)$/, "J-$1-$2");

  if (await db.user.findUnique({ where: { email } })) {
    return { errores: { email: ["Ya existe una cuenta con este correo."] } };
  }
  const existente = await db.aseguradora.findFirst({ where: { OR: [{ rif: rifNormal }, { nombre: empresa }] } });
  if (existente) {
    return { errores: { rif: ["Esta empresa ya está registrada. Pide a tu administrador que te invite."] } };
  }

  const sigla = empresa
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || empresa.slice(0, 2).toUpperCase();

  const user = await db.$transaction(async (tx) => {
    const aseguradora = await tx.aseguradora.create({ data: { nombre: empresa, rif: rifNormal, sigla, tipo } });
    return tx.user.create({
      data: {
        nombre, email, telefono, rol: "ASEGURADORA", aseguradoraId: aseguradora.id,
        passwordHash: await bcrypt.hash(password, 10),
        aceptaTerminosAt: new Date(),
      },
    });
  });

  await avisarAdmins("Nueva empresa por aprobar", `${empresa} (${rifNormal}) solicitó acceso a Perfila.`, "/admin/aseguradoras");
  await crearSesion({ userId: user.id, rol: "ASEGURADORA" });
  redirect("/aseguradora");
}

export async function registrarIntermediario(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const r = RegistroIntermediario.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };
  const { tipo, razonSocial, documento, numeroAutorizacion, nombre, email, telefono, password } = r.data;
  const doc = documento.replace(/^([VEJ])-?/, "$1-");

  if (await db.user.findUnique({ where: { email } })) {
    return { errores: { email: ["Ya existe una cuenta con este correo."] } };
  }
  if (await db.intermediario.findFirst({ where: { OR: [{ documento: doc }, { numeroAutorizacion }] } })) {
    return { errores: { numeroAutorizacion: ["Este intermediario ya está registrado."] } };
  }

  const user = await db.$transaction(async (tx) => {
    const intermediario = await tx.intermediario.create({ data: { tipo, nombre: razonSocial, documento: doc, numeroAutorizacion } });
    return tx.user.create({
      data: {
        nombre, email, telefono, rol: "INTERMEDIARIO", intermediarioId: intermediario.id,
        passwordHash: await bcrypt.hash(password, 10),
        aceptaTerminosAt: new Date(),
      },
    });
  });

  await avisarAdmins("Nuevo intermediario por verificar", `${razonSocial} (autorización ${numeroAutorizacion}) solicitó acceso.`, "/admin/intermediarios");
  await crearSesion({ userId: user.id, rol: "INTERMEDIARIO" });
  redirect("/intermediario");
}

async function avisarAdmins(titulo: string, mensaje: string, link: string) {
  const admins = await db.user.findMany({ where: { rol: "ADMIN", activo: true }, select: { id: true } });
  if (admins.length) {
    await db.notificacion.createMany({ data: admins.map((a) => ({ userId: a.id, titulo, mensaje, link })) });
  }
}

export async function ingresar(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const r = Ingreso.safeParse(Object.fromEntries(formData));
  if (!r.success) return { errores: erroresDe(r.error) };

  const user = await db.user.findUnique({ where: { email: r.data.email } });
  const valido = await bcrypt.compare(r.data.password, user?.passwordHash ?? HASH_FICTICIO);
  if (!user || !valido) return { mensaje: "Correo o contraseña incorrectos." };
  if (!user.activo) return { mensaje: "Tu cuenta está desactivada. Contacta a soporte." };

  const rol = user.rol as Rol;
  await crearSesion({ userId: user.id, rol });
  redirect(rutaSegura(formData.get("siguiente"), rol));
}

export async function salir() {
  await borrarSesion();
  redirect("/");
}
