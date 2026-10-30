import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ModalClaveEmergencia } from "@/components/modal-clave-emergencia";
import { Alerta, Badge, BadgeEstado, Encabezado, LogoAseguradora, Tarjeta } from "@/components/ui";
import { requerirRol } from "@/lib/dal";
import { db } from "@/lib/db";
import {
  ESTADO_CLAVE, ESTADO_PAGO, ESTADO_POLIZA, ESTADO_SINIESTRO, METODOS_PAGO, RAMOS, RAMOS_CON_CLAVE, TIPOS_EMPRESA,
  TIPOS_INTERMEDIARIO, codigoRamo, fecha, fechaHora, usd, usdEntero, vencePronto, vencida,
  type MetodoPago, type Ramo, type TipoEmpresa, type TipoIntermediario,
} from "@/lib/dominio";
import { FormularioPago, FormularioSiniestro } from "./formularios";

export const metadata: Metadata = { title: "Detalle de póliza" };

export default async function PolizaPage({ params, searchParams }: PageProps<"/app/polizas/[id]">) {
  const user = await requerirRol("PERSONA");
  const { id } = await params;
  const { nueva } = await searchParams;

  const p = await db.poliza.findFirst({
    where: { id, userId: user.id },
    include: {
      aseguradora: true,
      intermediario: { include: { usuarios: { select: { telefono: true, email: true }, take: 1 } } },
      user: { select: { telefono: true } },
      claves: { orderBy: { createdAt: "desc" } },
      oferta: { select: { resumen: true, exclusiones: true } },
      pagos: { orderBy: { createdAt: "desc" } },
      siniestros: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!p) notFound();

  const prod = RAMOS[p.ramo as Ramo];
  const pagoEnRevision = p.pagos.some((x) => x.estado === "EN_REVISION");
  const proximoVence = p.pagadaHasta && vencePronto(p.pagadaHasta);
  const debePagar = p.estado === "PENDIENTE_PAGO" || (p.estado === "ACTIVA" && proximoVence);
  const ramoContable = codigoRamo(p.ramo as Ramo, p.aseguradora.tipo as TipoEmpresa);
  const conClave = RAMOS_CON_CLAVE.includes(p.ramo as Ramo);
  const alDia = p.estado === "ACTIVA" && !(p.pagadaHasta && vencida(p.pagadaHasta));
  const contactoIntermediario = p.intermediario.usuarios[0];

  return (
    <>
      {nueva && (
        <div className="mb-6">
          <Alerta tono="green">
            <b>¡Tu póliza fue emitida!</b> Realiza el primer pago y repórtalo aquí abajo para activarla.
          </Alerta>
        </div>
      )}
      <Encabezado
        titulo={`${prod.icono} ${prod.nombre}`}
        descripcion={`Póliza N.° ${p.numero}${ramoContable ? ` · Ramo ${ramoContable.codigo} ${ramoContable.nombre}` : ""}`}
        accion={
          <div className="flex items-center gap-3">
            {conClave && alDia && (
              <ModalClaveEmergencia
                polizas={[{ id: p.id, numero: p.numero, empresa: p.aseguradora.nombre }]}
                titular={user.nombre}
                telefono={p.user.telefono}
              />
            )}
            <BadgeEstado estado={p.estado} mapa={ESTADO_POLIZA} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tarjeta>
            <div className="flex items-center gap-3">
              <LogoAseguradora sigla={p.aseguradora.sigla} color={p.aseguradora.color} />
              <div>
                <h2 className="font-semibold">{p.aseguradora.nombre}</h2>
                <p className="text-xs text-slate-500">{TIPOS_EMPRESA[p.aseguradora.tipo as TipoEmpresa].nombre} · RIF {p.aseguradora.rif}</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-500">Tu intermediario: </span>
              <b>{p.intermediario.nombre}</b>
              <span className="text-slate-500">
                {" "}· {TIPOS_INTERMEDIARIO[p.intermediario.tipo as TipoIntermediario].nombre} · Aut. {p.intermediario.numeroAutorizacion}
                {contactoIntermediario && ` · ${contactoIntermediario.telefono ?? contactoIntermediario.email}`}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Dato k="Prima mensual" v={usd(p.primaCents)} />
              <Dato k="Suma asegurada" v={usdEntero(p.sumaAseguradaUsd)} />
              <Dato k="Inicio" v={p.inicio ? fecha(p.inicio) : "Al confirmar pago"} />
              <Dato k="Pagada hasta" v={p.pagadaHasta ? fecha(p.pagadaHasta) : "—"} />
            </dl>
            <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <p><b>Qué cubre:</b> {p.oferta.resumen}</p>
              <p><b>Qué no cubre:</b> {p.oferta.exclusiones}</p>
            </div>
          </Tarjeta>

          {debePagar && !pagoEnRevision && (
            <Tarjeta>
              <h2 className="font-semibold">{p.estado === "PENDIENTE_PAGO" ? "Paga para activar tu póliza" : "Paga tu próxima cuota"}</h2>
              <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
                <p className="font-medium">Datos de pago de {p.aseguradora.nombre}</p>
                <ul className="mt-2 space-y-1 text-slate-700">
                  {p.aseguradora.pagoMovilBanco && <li>📱 Pago Móvil: {p.aseguradora.pagoMovilBanco} · {p.aseguradora.pagoMovilTelefono} · {p.aseguradora.rif}</li>}
                  {p.aseguradora.cuentaBancaria && <li>🏦 Cuenta: {p.aseguradora.cuentaBancaria}</li>}
                  {!p.aseguradora.pagoMovilBanco && !p.aseguradora.cuentaBancaria && <li>La empresa te contactará con los datos de pago.</li>}
                  <li>💵 Monto: <b>{usd(p.primaCents)}</b> (en bolívares a la tasa oficial BCV del día)</li>
                </ul>
              </div>
              <div className="mt-4">
                <FormularioPago polizaId={p.id} />
              </div>
            </Tarjeta>
          )}
          {pagoEnRevision && (
            <Alerta tono="amber">✅ Registramos tu pago y está en revisión. Te avisaremos cuando la empresa lo confirme (normalmente en menos de 24 horas).</Alerta>
          )}

          {p.estado === "ACTIVA" && (
            <Tarjeta>
              <h2 className="font-semibold">🆘 Reportar un siniestro</h2>
              <p className="mt-1 text-sm text-slate-600">¿Tuviste un accidente o una emergencia? Cuéntanos qué pasó.</p>
              <div className="mt-4"><FormularioSiniestro polizaId={p.id} /></div>
            </Tarjeta>
          )}
        </div>

        <div className="space-y-6">
          {conClave && (
            <Tarjeta>
              <h2 className="mb-3 font-semibold">Claves de emergencia</h2>
              {p.claves.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {alDia ? "Aún no has solicitado claves." : "Disponible cuando tu póliza esté activa y al día."}
                </p>
              ) : (
                <ul className="space-y-3">
                  {p.claves.map((c) => (
                    <li key={c.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold tracking-wider">{c.codigo}</span>
                        {c.estado === "EMITIDA" && vencida(c.venceAt) ? <Badge tono="gray">Vencida</Badge> : <BadgeEstado estado={c.estado} mapa={ESTADO_CLAVE} />}
                      </div>
                      <div className="text-xs text-slate-500">{c.paciente} · {c.clinica} · vence {fechaHora(c.venceAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </Tarjeta>
          )}
          <Tarjeta>
            <h2 className="mb-3 font-semibold">Pagos</h2>
            {p.pagos.length === 0 ? (
              <p className="text-sm text-slate-500">Sin pagos registrados.</p>
            ) : (
              <ul className="space-y-3">
                {p.pagos.map((x) => (
                  <li key={x.id} className="text-sm">
                    <div className="flex justify-between"><b>{usd(x.montoCents)}</b><BadgeEstado estado={x.estado} mapa={ESTADO_PAGO} /></div>
                    <div className="text-xs text-slate-500">{METODOS_PAGO[x.metodo as MetodoPago]} · {x.banco} · ref. {x.referencia} · {fecha(x.fechaPago)}</div>
                    {x.nota && <div className="text-xs text-red-600">{x.nota}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
          <Tarjeta>
            <h2 className="mb-3 font-semibold">Siniestros</h2>
            {p.siniestros.length === 0 ? (
              <p className="text-sm text-slate-500">Sin siniestros reportados.</p>
            ) : (
              <ul className="space-y-3">
                {p.siniestros.map((s) => (
                  <li key={s.id} className="text-sm">
                    <div className="flex justify-between"><b>{usd(s.montoReclamadoCents)}</b><BadgeEstado estado={s.estado} mapa={ESTADO_SINIESTRO} /></div>
                    <div className="text-xs text-slate-500">{fecha(s.fechaOcurrencia)} · {s.descripcion.slice(0, 80)}{s.descripcion.length > 80 && "…"}</div>
                    {s.respuesta && <div className="mt-1 rounded-lg bg-slate-50 p-2 text-xs">💬 {s.respuesta}</div>}
                  </li>
                ))}
              </ul>
            )}
          </Tarjeta>
        </div>
      </div>
    </>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
