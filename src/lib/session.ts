import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Rol } from "./dominio";

export const SESSION_COOKIE = "perfila_session";
const DURACION_MS = 7 * 24 * 60 * 60 * 1000;

export type SessionPayload = { userId: string; rol: Rol };

function clave() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET no está configurado (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(secret);
}

export async function firmarSesion(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(new Date(Date.now() + DURACION_MS))
    .sign(clave());
}

export async function verificarSesion(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, clave(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.rol !== "string") return null;
    return { userId: payload.userId, rol: payload.rol as Rol };
  } catch {
    return null;
  }
}

export async function crearSesion(payload: SessionPayload) {
  const token = await firmarSesion(payload);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(Date.now() + DURACION_MS),
  });
}

export async function borrarSesion() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function leerSesion() {
  return verificarSesion((await cookies()).get(SESSION_COOKIE)?.value);
}
