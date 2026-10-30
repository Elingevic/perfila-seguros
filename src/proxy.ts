import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Chequeo optimista de sesión y rol por ruta. La autorización real se repite
// en cada página y server action (src/lib/dal.ts).

const AREAS: { prefijo: string; rol: string }[] = [
  { prefijo: "/app", rol: "PERSONA" },
  { prefijo: "/intermediario", rol: "INTERMEDIARIO" },
  { prefijo: "/aseguradora", rol: "ASEGURADORA" },
  { prefijo: "/admin", rol: "ADMIN" },
];
const INICIO: Record<string, string> = { PERSONA: "/app", INTERMEDIARIO: "/intermediario", ASEGURADORA: "/aseguradora", ADMIN: "/admin" };
const SOLO_INVITADOS = ["/ingresar", "/registro"];

async function rolDeSesion(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("perfila_session")?.value;
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return typeof payload.rol === "string" ? payload.rol : null;
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rol = await rolDeSesion(req);

  const area = AREAS.find((a) => pathname === a.prefijo || pathname.startsWith(a.prefijo + "/"));
  if (area) {
    if (!rol) {
      const url = new URL("/ingresar", req.url);
      url.searchParams.set("siguiente", pathname);
      return NextResponse.redirect(url);
    }
    if (rol !== area.rol) return NextResponse.redirect(new URL(INICIO[rol] ?? "/", req.url));
  }

  if (rol && SOLO_INVITADOS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL(INICIO[rol] ?? "/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/intermediario/:path*", "/aseguradora/:path*", "/admin/:path*", "/ingresar", "/registro/:path*"],
};
