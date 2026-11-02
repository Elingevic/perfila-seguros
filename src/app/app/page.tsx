import Link from "next/link";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import { ESTADO_POLIZA, RAMOS, haceCuanto, parseRamos, usd, vigenciaSolicitud, type Ramo } from "@/lib/dominio";
import { Badge, BadgeEstado, BotonLink, Encabezado, Kpi, LogoAseguradora, Tarjeta } from "@/components/ui";
import { ModalClaveEmergencia } from "@/components/modal-clave-emergencia";
import { polizasConClave } from "@/lib/consultas";

export default async function InicioPersonaPage() {
  const user = await requerirRol("PERSONA");
  const [perfil, polizas, notificaciones, conClave, contacto] = await Promise.all([
    db.perfil.findUnique({
      where: { userId: user.id },
      include: {
        solicitudes: {
          where: { estado: "ABIERTA" },
          take: 1,
          include: { ofertas: { where: { estado: "ENVIADA" }, select: { id: true } } },
        },
      },
    }),
    db.poliza.findMany({
      where: { userId: user.id, estado: { not: "CANCELADA" } },
      include: { aseguradora: true },
      orderBy: { createdAt: "desc" },
    }),
    db.notificacion.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    polizasConClave(user.id),
    db.user.findUnique({ where: { id: user.id }, select: { telefono: true } }),
  ]);

  const nombre = user.nombre.split(" ")[0];

  if (!perfil) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">¡Hola, {nombre}!</h1>
        <p className="mt-3 text-lg text-slate-600">
          Crea tu perfil asegurador en 2 minutos y los corredores y agentes autorizados empezarán a enviarte ofertas.
        </p>
        <BotonLink href="/app/perfil/crear" tamano="lg" className="mt-8">Crear mi perfil</BotonLink>
      </div>
    );
  }

  const solicitud = perfil.solicitudes[0];
  const activas = polizas.filter((p) => p.estado === "ACTIVA");
  const pendientes = polizas.filter((p) => p.estado === "PENDIENTE_PAGO");
  const totalMensual = activas.reduce((s, p) => s + p.primaCents, 0);

  return (
    <>
      <Encabezado
        titulo={`Hola, ${nombre}`}
        descripcion="Este es el resumen de tu protección."
        accion={<ModalClaveEmergencia polizas={conClave} titular={user.nombre} telefono={contacto?.telefono} />}
      />

      {pendientes.length > 0 && (
        <Tarjeta className="mb-6 border-amber-200 bg-amber-50">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-2xl">💳</span>
            <div className="flex-1">
              <b>Tienes {pendientes.length} póliza{pendientes.length > 1 ? "s" : ""} esperando tu pago</b>
              <p className="text-sm text-amber-800">Se activan apenas la empresa confirme el pago.</p>
            </div>
            <BotonLink href={`/app/polizas/${pendientes[0].id}`}>Pagar ahora</BotonLink>
          </div>
        </Tarjeta>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi valor={activas.length} etiqueta="Pólizas activas" />
        <Kpi valor={usd(totalMensual)} etiqueta="Pagas al mes" />
        <Kpi valor={solicitud?.ofertas.length ?? 0} etiqueta="Ofertas por revisar" />
        <Kpi valor={`#${perfil.codigo}`} etiqueta="Tu código de perfil" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Tu perfil en el mercado</h2>
                {solicitud ? (
                  <p className="mt-1 text-sm text-slate-600">
                    Publicado · recibe ofertas {vigenciaSolicitud(solicitud.expiraAt)}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">No está publicado. Publícalo para recibir nuevas ofertas.</p>
                )}
              </div>
              {solicitud ? <Badge tono="green">● Publicado</Badge> : <Badge tono="gray">No publicado</Badge>}
            </div>
            {solicitud && (
              <div className="mt-4 flex flex-wrap gap-2">
                {parseRamos(solicitud.ramos).map((p) => (
                  <Badge key={p}>{RAMOS[p].icono} {RAMOS[p].nombre}</Badge>
                ))}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {solicitud ? (
                <BotonLink href="/app/ofertas">Ver ofertas ({solicitud.ofertas.length})</BotonLink>
              ) : (
                <BotonLink href="/app/perfil/crear">Publicar perfil</BotonLink>
              )}
              <BotonLink href="/app/perfil" variante="borde">Ver perfil</BotonLink>
            </div>
          </Tarjeta>

          <Tarjeta>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Mis pólizas</h2>
              <Link href="/app/polizas" className="text-sm font-semibold text-marca-600">Ver todas</Link>
            </div>
            {polizas.length === 0 ? (
              <p className="text-sm text-slate-600">Aún no tienes pólizas. Elige una oferta para empezar.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {polizas.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    <Link href={`/app/polizas/${p.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                      <LogoAseguradora sigla={p.aseguradora.sigla} color={p.aseguradora.color} tamano={36} />
                      <div className="flex-1">
                        <div className="font-medium">{RAMOS[p.ramo as Ramo].nombre}</div>
                        <div className="text-xs text-slate-500">{p.aseguradora.nombre} · {p.numero}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{usd(p.primaCents)}/mes</div>
                        <BadgeEstado estado={p.estado} mapa={ESTADO_POLIZA} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>

        <Tarjeta className="h-fit">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Actividad</h2>
            <Link href="/notificaciones" className="text-sm font-semibold text-marca-600">Ver todo</Link>
          </div>
          {notificaciones.length === 0 ? (
            <p className="text-sm text-slate-600">Sin novedades por ahora.</p>
          ) : (
            <ul className="space-y-4">
              {notificaciones.map((n) => (
                <li key={n.id} className="text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    {!n.leida && <span className="size-2 rounded-full bg-marca-600" />}
                    {n.titulo}
                  </div>
                  <p className="text-slate-600">{n.mensaje}</p>
                  <p className="text-xs text-slate-400">{haceCuanto(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
