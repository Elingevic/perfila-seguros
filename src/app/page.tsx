import Link from "next/link";
import { BotonLink, Logo } from "@/components/ui";
import { PiePagina } from "@/components/pie-pagina";
import { usuarioActual } from "@/lib/dal";
import { CODIGOS_RAMO, GRUPOS_RAMO, RAMOS, RUTA_INICIO } from "@/lib/dominio";

const PASOS = [
  ["Crea tu perfil", "Responde 7 preguntas en 2 minutos: edad, ocupación, vehículo, dependientes y cuánto puedes pagar."],
  ["Te orientamos", "Te recomendamos qué ramos necesitas y te explicamos por qué, en lenguaje sencillo."],
  ["Los corredores compiten", "Tu perfil anónimo llega a corredores y agentes autorizados, que te ofrecen productos de las empresas que representan."],
  ["Eliges y pagas", "Comparas precio, cobertura y rapidez de pago. Contratas en línea y pagas con Pago Móvil."],
] as const;

const PREGUNTAS = [
  ["¿Cuánto cuesta usar Perfila?", "Nada. Crear tu perfil y recibir ofertas es gratis. Solo pagas la prima de la póliza que elijas, directamente a la empresa."],
  ["¿Quién me hace las ofertas?", "Corredores de seguros, agentes y sociedades de corretaje con autorización vigente de la SUDEASEG. Cada oferta muestra quién la propone y qué empresa la respalda."],
  ["¿Ven mis datos personales?", "No. Ven un perfil anónimo (edad, estado, ocupación, presupuesto y ramos que buscas). Tu nombre y contacto solo se comparten con el intermediario y la empresa de la oferta que aceptes."],
  ["¿Qué es la clave de emergencia?", "Si tienes una póliza de medicina prepagada activa, puedes pedir desde tu teléfono la clave para que te atiendan en la clínica. Se emite al instante y vale 24 horas."],
  ["¿Cómo pago?", "Mensualmente, por Pago Móvil, transferencia o tarjeta. Reportas el pago en la app y la empresa lo confirma."],
  ["¿Qué pasa si cambio de trabajo?", "Nada: tu perfil y tus pólizas son tuyos, no de tu empleador. Te siguen a donde vayas."],
] as const;

export default async function Inicio() {
  const user = await usuarioActual();

  return (
    <>
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
          <Logo claro />
          <nav className="flex items-center gap-2">
            {user ? (
              <BotonLink href={RUTA_INICIO[user.rol]} variante="secundario">Ir a mi panel</BotonLink>
            ) : (
              <>
                <Link href="/ingresar" className="rounded-xl px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">Ingresar</Link>
                <BotonLink href="/registro" variante="secundario">Crear perfil gratis</BotonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-marca-950 via-marca-900 to-marca-600 pb-24 pt-36 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
            <div>
              <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm text-marca-100">
                Para jóvenes en Venezuela sin seguro de empresa
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Publica tu perfil.<br />
                <span className="text-marca-200">Los corredores compiten por ti.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-marca-100">
                Crea tu perfil asegurador en 2 minutos y recibe ofertas de corredores y agentes autorizados, respaldadas por empresas
                reguladas. Asegúrate desde <b className="text-white">$3 al mes</b>, sin oficinas ni papeleo.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BotonLink href="/registro" tamano="lg" variante="secundario">Crear mi perfil gratis</BotonLink>
                <BotonLink href="#como-funciona" tamano="lg" className="border border-white/30 bg-transparent hover:bg-white/10">
                  Cómo funciona
                </BotonLink>
              </div>
              <p className="mt-6 text-sm text-marca-200">🔒 Perfil anónimo · 🚑 Clave de emergencia · 📱 Pago Móvil</p>
            </div>

            {/* Maqueta de ofertas */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-3xl bg-white p-5 text-slate-900 shadow-2xl">
                <div className="flex items-center gap-3 rounded-2xl bg-marca-900 p-4 text-white">
                  <span className="text-2xl">📨</span>
                  <div>
                    <b>4 ofertas recibidas</b>
                    <div className="text-xs text-marca-200">Accidentes Personales · ramo 06</div>
                  </div>
                </div>
                {[
                  ["CS", "Corredor de Seguros", "Empresa A", "$3,40", "Más barata"],
                  ["SC", "Sociedad de Corretaje", "Empresa B", "$4,10", "Mayor cobertura"],
                  ["AG", "Agente de Seguros", "Empresa C", "$3,90", "Paga más rápido"],
                ].map(([s, t, e, p, b], i) => (
                  <div key={t} className="animar-aparecer mt-3 rounded-2xl border border-slate-200 p-3" style={{ animationDelay: `${i * 0.15}s` }}>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-marca-900 text-xs font-bold text-white">{s}</div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{t}</div>
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">{b}</span>
                      </div>
                      <div className="text-right font-bold">{p}<div className="text-[10px] font-normal text-slate-500">/mes</div></div>
                    </div>
                    <div className="mt-2 rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-500">Respaldada por {e}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Problema */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Si no trabajas en una empresa que te dé seguro, lo más probable es que no tengas ninguno.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">No es falta de interés. Es que nadie te lo ha puesto fácil.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["🏢", "Difícil acceso", "Contratar una póliza individual es lento, presencial y pensado para otro tipo de cliente."],
              ["🤷", "Poca información", "Nadie te explica en lenguaje simple qué necesitas, qué cubre y cuánto cuesta."],
              ["💸", "Precios fuera de alcance", "Los planes vienen en paquetes grandes y caros. No hay opciones pequeñas a tu medida."],
            ].map(([i, t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="text-3xl">{i}</div>
                <h3 className="mt-3 font-semibold">{t}</h3>
                <p className="mt-2 text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="scroll-mt-8 bg-white py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tú publicas, ellos te buscan</h2>
            <p className="mt-3 text-lg text-slate-600">No tienes que salir a buscar un seguro: los intermediarios autorizados vienen a ti.</p>
            <ol className="mt-10 grid gap-6 md:grid-cols-4">
              {PASOS.map(([t, d], i) => (
                <li key={t}>
                  <div className="flex size-10 items-center justify-center rounded-full bg-marca-600 font-bold text-white">{i + 1}</div>
                  <h3 className="mt-4 font-semibold">{t}</h3>
                  <p className="mt-2 text-slate-600">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ramos */}
        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Arma tu protección por ramos</h2>
          <p className="mt-3 text-lg text-slate-600">Elige solo lo que necesitas y ajústalo a tu presupuesto.</p>
          {Object.entries(GRUPOS_RAMO).map(([g, titulo]) => (
            <div key={g} className="mt-10">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">{titulo}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {CODIGOS_RAMO.filter((k) => RAMOS[k].grupo === g).map((k) => (
                  <div key={k} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-3xl">{RAMOS[k].icono}</div>
                    <h4 className="mt-3 font-semibold">{RAMOS[k].nombre}</h4>
                    <p className="mt-1 text-sm text-slate-600">{RAMOS[k].descripcion}</p>
                    <p className="mt-3 text-sm">desde <b>~${(RAMOS[k].baseUsd * 0.85).toFixed(2)}</b>/mes</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-6 text-xs text-slate-500">
            Ramos según el catálogo de ramos contables de la SUDEASEG. Precios referenciales: cada oferta define su prima según tu perfil.
          </p>
        </section>

        {/* Clave de emergencia */}
        <section className="px-4 pb-20">
          <div className="mx-auto grid max-w-6xl items-center gap-8 rounded-3xl border border-red-100 bg-red-50 p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <span className="text-4xl">🚑</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Clave de emergencia desde tu teléfono</h2>
              <p className="mt-3 text-lg text-slate-700">
                Con tu póliza de medicina prepagada activa, pides la clave para que te atiendan en la clínica en segundos, sin llamadas
                ni esperas. Tu empresa la recibe al instante.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm rounded-2xl border-2 border-dashed border-green-500 bg-white p-6 text-center">
              <div className="text-xs uppercase tracking-wider text-green-800">Clave de emergencia</div>
              <div className="mt-1 font-mono text-3xl font-extrabold tracking-widest text-green-900">EMG-7KQ2-X9HD</div>
              <div className="mt-2 text-sm text-slate-600">Válida por 24 horas</div>
            </div>
          </div>
        </section>

        {/* Intermediarios y empresas */}
        <section className="bg-marca-950 py-20 text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">¿Eres corredor, agente o sociedad de corretaje?</h2>
              <p className="mt-4 text-marca-100">
                Recibe perfiles de clientes que buscan seguro, con necesidades y presupuesto claros, y ofréceles los productos de las
                empresas que representas.
              </p>
              <ul className="mt-6 space-y-2 text-marca-100">
                <li>✓ Clientes nuevos sin costo de prospección</li>
                <li>✓ Oferta por ramo con el respaldo de tus empresas</li>
                <li>✓ Tu cartera, pagos y renovaciones en un solo panel</li>
              </ul>
              <BotonLink href="/registro/intermediario" tamano="lg" variante="secundario" className="mt-8">Registrarme como intermediario</BotonLink>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">¿Eres una empresa de seguros o de medicina prepagada?</h2>
              <p className="mt-4 text-marca-100">
                Habilita a tus intermediarios para que ofrezcan tus productos a un segmento que hoy no llega a tu canal tradicional.
              </p>
              <ul className="mt-6 space-y-2 text-marca-100">
                <li>✓ Aprueba qué intermediarios te representan</li>
                <li>✓ Verifica pagos y gestiona siniestros</li>
                <li>✓ Recibe y controla claves de emergencia en tiempo real</li>
              </ul>
              <BotonLink href="/registro/aseguradora" tamano="lg" variante="secundario" className="mt-8">Registrar mi empresa</BotonLink>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">Preguntas frecuentes</h2>
          <div className="mt-10 space-y-3">
            {PREGUNTAS.map(([p, r]) => (
              <details key={p} className="group rounded-2xl border border-slate-200 bg-white p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
                  {p}<span className="text-marca-600 transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-slate-600">{r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-marca-600 to-marca-500 p-10 text-center text-white sm:p-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tu primera póliza puede nacer en tu teléfono</h2>
            <p className="mt-3 text-lg text-marca-100">2 minutos. Gratis. Sin compromiso.</p>
            <BotonLink href="/registro" tamano="lg" variante="secundario" className="mt-8">Crear mi perfil gratis</BotonLink>
          </div>
        </section>
      </main>
      <PiePagina />
    </>
  );
}
