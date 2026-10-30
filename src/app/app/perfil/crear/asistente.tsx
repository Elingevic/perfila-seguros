"use client";

import { useMemo, useState, useTransition } from "react";
import { guardarYPublicarPerfil, type DatosAsistente } from "@/actions/persona";
import { Alerta, Boton, Campo, Input, Select, cx } from "@/components/ui";
import {
  CODIGOS_PRODUCTO, ESTADOS_VE, OCUPACIONES, PRESUPUESTO_MAX, PRESUPUESTO_MIN, PRODUCTOS, SALUD, VEHICULOS,
  edadDesde, motivoRecomendacion, primaEstimada, recomendar,
  type DatosPerfil, type Ocupacion, type Producto, type Salud, type Vehiculo,
} from "@/lib/dominio";

type Props = { inicial?: Omit<DatosAsistente, "productos"> & { productos?: string[] }; nombre: string };

const DEPENDIENTES: [number, string][] = [[0, "No"], [1, "Sí, 1 persona"], [2, "Sí, 2 personas"], [3, "Sí, 3 o más"]];

export function Asistente({ inicial, nombre }: Props) {
  const [paso, setPaso] = useState(0);
  const [d, setD] = useState<DatosAsistente>({
    fechaNacimiento: inicial?.fechaNacimiento ?? "",
    estadoResidencia: inicial?.estadoResidencia ?? "",
    ocupacion: inicial?.ocupacion ?? "",
    vehiculo: inicial?.vehiculo ?? "",
    dependientes: inicial?.dependientes ?? -1,
    salud: inicial?.salud ?? "",
    presupuestoUsd: inicial?.presupuestoUsd ?? 12,
    productos: inicial?.productos ?? [],
  });
  const [errores, setErrores] = useState<Record<string, string[] | undefined>>();
  const [mensaje, setMensaje] = useState<string>();
  const [enviando, iniciar] = useTransition();

  const set = <K extends keyof DatosAsistente>(k: K, v: DatosAsistente[K]) => setD((x) => ({ ...x, [k]: v }));

  const perfil = useMemo(() => perfilDe(d), [d]);

  const edad = d.fechaNacimiento ? edadDesde(new Date(d.fechaNacimiento + "T12:00:00")) : null;
  const edadValida = edad !== null && edad >= 18 && edad <= 75;

  // Cada paso: título, contenido y si se puede avanzar
  const pasos = [
    {
      titulo: "¿Cuándo naciste y dónde vives?",
      sub: "La edad influye en el precio de algunas coberturas.",
      valido: edadValida && !!d.estadoResidencia,
      contenido: (
        <div className="space-y-4">
          <Campo
            etiqueta="Fecha de nacimiento"
            error={edad !== null && !edadValida ? (edad < 18 ? "Debes ser mayor de 18 años." : "Por ahora atendemos hasta 75 años.") : errores?.fechaNacimiento}
          >
            <Input type="date" value={d.fechaNacimiento} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => set("fechaNacimiento", e.target.value)} />
          </Campo>
          <Campo etiqueta="Estado" error={errores?.estadoResidencia}>
            <Select value={d.estadoResidencia} onChange={(e) => set("estadoResidencia", e.target.value)}>
              <option value="">Selecciona…</option>
              {ESTADOS_VE.map((e) => <option key={e}>{e}</option>)}
            </Select>
          </Campo>
        </div>
      ),
    },
    opciones("¿A qué te dedicas?", "ocupacion", OCUPACIONES),
    opciones("¿Cómo te mueves?", "vehiculo", VEHICULOS),
    {
      titulo: "¿Alguien depende económicamente de ti?",
      sub: "Hijos, pareja, padres…",
      valido: d.dependientes >= 0,
      contenido: (
        <div className="space-y-2">
          {DEPENDIENTES.map(([v, l]) => (
            <Opcion key={v} activa={d.dependientes === v} onClick={() => { set("dependientes", v); avanzar(); }}>{l}</Opcion>
          ))}
        </div>
      ),
    },
    opciones("¿Cómo describirías tu salud?", "salud", SALUD, "Es confidencial. Solo se usa para orientarte."),
    {
      titulo: "¿Cuánto podrías pagar al mes?",
      sub: "Armamos tu plan para que no te pases.",
      valido: true,
      contenido: (
        <div className="py-4">
          <div className="text-center text-5xl font-extrabold text-marca-600">
            ${d.presupuestoUsd}<span className="text-lg font-medium text-slate-500">/mes</span>
          </div>
          <input type="range" className="mt-6 w-full accent-marca-600" min={PRESUPUESTO_MIN} max={PRESUPUESTO_MAX}
            value={d.presupuestoUsd} onChange={(e) => set("presupuestoUsd", Number(e.target.value))} aria-label="Presupuesto mensual" />
          <div className="flex justify-between text-xs text-slate-500"><span>${PRESUPUESTO_MIN}</span><span>${PRESUPUESTO_MAX}</span></div>
        </div>
      ),
    },
    {
      titulo: "Esto es lo que te recomendamos",
      sub: "Activa o desactiva lo que quieras. Las aseguradoras te harán ofertas para cada cobertura.",
      valido: d.productos.length > 0,
      contenido: perfil && <Coberturas perfil={perfil} elegidos={d.productos} onCambio={(p) => set("productos", p)} />,
    },
  ];

  function opciones<K extends "ocupacion" | "vehiculo" | "salud">(titulo: string, k: K, mapa: Record<string, string>, sub?: string) {
    return {
      titulo, sub, valido: !!d[k],
      contenido: (
        <div className="space-y-2">
          {Object.entries(mapa).map(([v, l]) => (
            <Opcion key={v} activa={d[k] === v} onClick={() => { set(k, v); avanzar(); }}>{l}</Opcion>
          ))}
        </div>
      ),
    };
  }

  function irAPaso(n: number) {
    const destino = Math.min(n, pasos.length - 1);
    if (destino === pasos.length - 1) {
      // Al llegar a coberturas, precarga las recomendadas si aún no hay elección
      setD((x) => {
        const p = perfilDe(x);
        return x.productos.length > 0 || !p ? x : { ...x, productos: recomendar(p) };
      });
    }
    setPaso(destino);
  }

  // Las opciones avanzan solas; es idempotente si además se pulsa "Continuar"
  function avanzar() {
    const desde = paso;
    setTimeout(() => irAPaso(desde + 1), 150);
  }

  function siguiente() {
    irAPaso(paso + 1);
  }

  function publicar() {
    setErrores(undefined);
    setMensaje(undefined);
    iniciar(async () => {
      const r = await guardarYPublicarPerfil(d);
      if (r?.errores) setErrores(r.errores);
      if (r?.mensaje) setMensaje(r.mensaje);
    });
  }

  const actual = pasos[paso];
  const ultimo = paso === pasos.length - 1;

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
        <span>Hola, {nombre.split(" ")[0]} 👋</span>
        <span>Paso {paso + 1} de {pasos.length}</span>
      </div>
      <div className="mb-8 h-2 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-marca-600 transition-all" style={{ width: `${((paso + 1) / pasos.length) * 100}%` }} />
      </div>

      <div key={paso} className="animar-aparecer">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{actual.titulo}</h1>
        {actual.sub && <p className="mt-2 text-slate-600">{actual.sub}</p>}
        <div className="mt-6">{actual.contenido}</div>
      </div>

      {mensaje && <div className="mt-4"><Alerta>{mensaje}</Alerta></div>}
      {errores && !mensaje && <div className="mt-4"><Alerta>Revisa los datos: {Object.values(errores).flat().filter(Boolean)[0]}</Alerta></div>}

      <div className="mt-8 flex gap-3">
        {paso > 0 && <Boton variante="borde" onClick={() => setPaso(paso - 1)} disabled={enviando}>Atrás</Boton>}
        {ultimo ? (
          <Boton className="flex-1" tamano="lg" disabled={!actual.valido || enviando} onClick={publicar}>
            {enviando ? "Publicando…" : "Publicar mi perfil y recibir ofertas"}
          </Boton>
        ) : (
          <Boton className="flex-1" tamano="lg" disabled={!actual.valido} onClick={siguiente}>Continuar</Boton>
        )}
      </div>
      {ultimo && (
        <p className="mt-4 text-center text-xs text-slate-500">
          🔒 Tu perfil es anónimo: las aseguradoras ven tu edad, ocupación y estado, pero no tu nombre ni tus datos de contacto.
        </p>
      )}
    </div>
  );
}

function perfilDe(d: DatosAsistente): DatosPerfil | null {
  if (!d.fechaNacimiento || !d.ocupacion || !d.vehiculo || d.dependientes < 0 || !d.salud) return null;
  return {
    edad: edadDesde(new Date(d.fechaNacimiento + "T12:00:00")),
    ocupacion: d.ocupacion as Ocupacion,
    vehiculo: d.vehiculo as Vehiculo,
    dependientes: d.dependientes,
    salud: d.salud as Salud,
    presupuestoUsd: d.presupuestoUsd,
  };
}

function Opcion({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cx(
        "block w-full rounded-2xl border-2 p-4 text-left font-medium transition",
        activa ? "border-marca-600 bg-marca-50 text-marca-700" : "border-slate-200 bg-white hover:border-slate-300",
      )}>
      {children}
    </button>
  );
}

function Coberturas({ perfil, elegidos, onCambio }: { perfil: DatosPerfil; elegidos: string[]; onCambio: (p: string[]) => void }) {
  const total = elegidos.reduce((s, p) => s + primaEstimada(p as Producto, perfil), 0);
  const recomendados = recomendar(perfil);
  return (
    <div className="space-y-3">
      {CODIGOS_PRODUCTO.map((k) => {
        const on = elegidos.includes(k);
        const motivo = recomendados.includes(k) ? motivoRecomendacion(k, perfil) : null;
        return (
          <button key={k} type="button" onClick={() => onCambio(on ? elegidos.filter((x) => x !== k) : [...elegidos, k])}
            className={cx("flex w-full gap-4 rounded-2xl border-2 bg-white p-4 text-left transition", on ? "border-marca-600" : "border-slate-200")}>
            <span className="text-2xl">{PRODUCTOS[k].icono}</span>
            <span className="flex-1">
              <span className="block font-semibold">{PRODUCTOS[k].nombre}</span>
              <span className="block text-sm text-slate-600">{PRODUCTOS[k].descripcion}</span>
              {motivo && <span className="mt-1 block text-sm text-marca-600">💡 {motivo}</span>}
              <span className="mt-1 block text-sm">desde ~<b>${(primaEstimada(k, perfil) * 0.85).toFixed(2)}</b>/mes</span>
            </span>
            <span className={cx("relative mt-1 h-6 w-11 shrink-0 rounded-full transition", on ? "bg-marca-600" : "bg-slate-300")}>
              <span className={cx("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", on ? "left-5.5" : "left-0.5")} />
            </span>
          </button>
        );
      })}
      <p className={cx("text-center text-sm", total > perfil.presupuestoUsd ? "text-amber-700" : "text-slate-600")}>
        Estimado: ~${total.toFixed(2)}/mes de tu presupuesto de ${perfil.presupuestoUsd}
        {total > perfil.presupuestoUsd && " — podrías pasarte; las ofertas reales pueden ser menores."}
      </p>
    </div>
  );
}
