// Datos de demostración. BORRA la base de datos antes de cargar.
// Uso: npm run db:seed
// Empresas e intermediarios son FICTICIOS; los tipos de sujeto regulado y los
// ramos corresponden a los catálogos oficiales de la SUDEASEG.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  RAMOS, codigoRamo, edadDesde, primaEstimada, recomendar,
  type DatosPerfil, type Ocupacion, type Ramo, type Salud, type TipoEmpresa, type TipoIntermediario, type Vehiculo,
} from "../src/lib/dominio";

const db = new PrismaClient();
const CLAVE = "Perfila2026";
const DIA = 24 * 3600 * 1000;

type EmpresaDemo = {
  clave: string; nombre: string; rif: string; tipo: TipoEmpresa; sigla: string; color: string;
  precio: number; cobertura: number; pct: number; dias: number; banco: string; email: string; estado?: string;
};
const EMPRESAS: EmpresaDemo[] = [
  { clave: "tepuy", nombre: "Seguros Tepuy", rif: "J-40000001-1", tipo: "SEGUROS", sigla: "ST", color: "#0ea5e9", precio: 1.0, cobertura: 1.0, pct: 94, dias: 12, banco: "0134 Banesco", email: "tepuy@demo.perfila.app" },
  { clave: "morrocoy", nombre: "Morrocoy Seguros", rif: "J-40000002-2", tipo: "SEGUROS", sigla: "MS", color: "#f97316", precio: 0.86, cobertura: 0.8, pct: 88, dias: 19, banco: "0105 Banco Mercantil", email: "morrocoy@demo.perfila.app" },
  { clave: "avila", nombre: "Ávila Seguros", rif: "J-40000003-3", tipo: "SEGUROS", sigla: "ÁS", color: "#16a34a", precio: 1.15, cobertura: 1.3, pct: 97, dias: 7, banco: "0102 Banco de Venezuela", email: "avila@demo.perfila.app" },
  { clave: "caribe", nombre: "Salud Integral Caribe", rif: "J-40000004-4", tipo: "MEDICINA_PREPAGADA", sigla: "SI", color: "#e11d48", precio: 0.92, cobertura: 1.0, pct: 95, dias: 5, banco: "0108 BBVA Provincial", email: "saludcaribe@demo.perfila.app" },
  { clave: "andina", nombre: "Médica Andina Prepagada", rif: "J-40000005-5", tipo: "MEDICINA_PREPAGADA", sigla: "MA", color: "#0d9488", precio: 1.05, cobertura: 1.2, pct: 93, dias: 6, banco: "0172 Bancamiga Banco Universal", email: "medicandina@demo.perfila.app" },
  { clave: "llanera", nombre: "Cooperativa Llanera de Seguros", rif: "J-40000006-6", tipo: "COOPERATIVA", sigla: "CL", color: "#a855f7", precio: 0.8, cobertura: 0.85, pct: 90, dias: 15, banco: "0163 Banco del Tesoro", email: "llanera@demo.perfila.app" },
  { clave: "orinoco", nombre: "Seguros Orinoco", rif: "J-40000007-7", tipo: "SEGUROS", sigla: "SO", color: "#64748b", precio: 1, cobertura: 1, pct: 0, dias: 0, banco: "0134 Banesco", email: "orinoco@demo.perfila.app", estado: "PENDIENTE" },
];

type IntermediarioDemo = {
  clave: string; nombre: string; tipo: TipoIntermediario; documento: string; autorizacion: string; contacto: string;
  email: string; factor: number; vinculos: string[]; pendientes?: string[]; estado?: string;
};
const INTERMEDIARIOS: IntermediarioDemo[] = [
  { clave: "corretaje", nombre: "Corretaje Andino, C.A.", tipo: "SOCIEDAD_CORRETAJE", documento: "J-41000001-1", autorizacion: "SC-0451", contacto: "Gabriela Rondón", email: "corretaje@demo.perfila.app", factor: 0.97, vinculos: ["tepuy", "avila", "caribe", "andina"] },
  { clave: "ana", nombre: "Ana Martínez", tipo: "CORREDOR", documento: "V-18000001", autorizacion: "CS-12873", contacto: "Ana Martínez", email: "ana@demo.perfila.app", factor: 1.0, vinculos: ["tepuy", "morrocoy", "llanera"] },
  { clave: "pedro", nombre: "Pedro Salas", tipo: "AGENTE_MEDICINA_PREPAGADA", documento: "V-20000002", autorizacion: "AMP-3310", contacto: "Pedro Salas", email: "pedro@demo.perfila.app", factor: 0.95, vinculos: ["caribe", "andina"] },
  { clave: "luisa", nombre: "Luisa Herrera", tipo: "AGENTE", documento: "V-19000003", autorizacion: "AG-5520", contacto: "Luisa Herrera", email: "luisa@demo.perfila.app", factor: 1.02, vinculos: ["avila"], pendientes: ["tepuy"] },
  { clave: "brito", nombre: "Carlos Brito", tipo: "CORREDOR", documento: "V-17000004", autorizacion: "CS-20991", contacto: "Carlos Brito", email: "brito@demo.perfila.app", factor: 1, vinculos: [], estado: "PENDIENTE" },
];

const PERSONAS = [
  { nombre: "Luis Pérez", email: "luis@demo.perfila.app", nac: "2002-03-14", estado: "Carabobo", ocupacion: "REPARTIDOR", vehiculo: "MOTO", dep: 0, salud: "BUENA", presupuesto: 10, extra: [] as Ramo[] },
  { nombre: "María González", email: "maria@demo.perfila.app", nac: "1997-08-02", estado: "Distrito Capital", ocupacion: "FREELANCE", vehiculo: "NINGUNO", dep: 1, salud: "BUENA", presupuesto: 35, extra: ["MEDICINA_PREPAGADA"] as Ramo[] },
  { nombre: "Andrea Rojas", email: "andrea@demo.perfila.app", nac: "2005-01-20", estado: "Lara", ocupacion: "ESTUDIANTE", vehiculo: "NINGUNO", dep: 0, salud: "BUENA", presupuesto: 6, extra: [] as Ramo[] },
  { nombre: "Carlos Medina", email: "carlos@demo.perfila.app", nac: "1993-11-09", estado: "Zulia", ocupacion: "EMPRENDEDOR", vehiculo: "CARRO", dep: 2, salud: "CONTROLADA", presupuesto: 45, extra: ["AUTOMOVIL_CASCO"] as Ramo[] },
  { nombre: "José Ramírez", email: "jose@demo.perfila.app", nac: "2000-06-30", estado: "Miranda", ocupacion: "EMPLEADO", vehiculo: "MOTO", dep: 0, salud: "BUENA", presupuesto: 15, extra: [] as Ramo[] },
  { nombre: "Daniela Torres", email: "daniela@demo.perfila.app", nac: "1999-04-11", estado: "Mérida", ocupacion: "FREELANCE", vehiculo: "NINGUNO", dep: 0, salud: "NO_DECLARA", presupuesto: 20, extra: ["SUSTRACCION"] as Ramo[] },
];

const TEXTOS: Partial<Record<Ramo, [string, string]>> = {
  ACCIDENTES_PERSONALES: ["Gastos médicos por accidente, incapacidad total o parcial y muerte accidental, 24/7 en todo el país.", "Accidentes bajo efectos de alcohol o drogas, deportes extremos y lesiones previas a la póliza."],
  MEDICINA_PREPAGADA: ["Consultas con especialistas, emergencias 24 h con clave inmediata, laboratorio e imágenes básicas en red de clínicas.", "Hospitalización prolongada, cirugías programadas y tratamientos crónicos."],
  SALUD: ["Hospitalización, cirugía, maternidad (tras 10 meses) y exámenes asociados en red de clínicas.", "Preexistencias durante el primer año, tratamientos estéticos y odontología."],
  VIDA_INDIVIDUAL: ["Pago de la suma asegurada a tus beneficiarios por fallecimiento por cualquier causa.", "Suicidio durante el primer año y enfermedades preexistentes no declaradas."],
  RC_VEHICULOS: ["Daños a personas y bienes de terceros causados con tu vehículo, más asistencia legal.", "Daños a tu propio vehículo, conducción sin licencia y uso en competencias."],
  AUTOMOVIL_CASCO: ["Pérdida total o parcial de tu vehículo por choque, robo o incendio, con grúa incluida.", "Desgaste, fallas mecánicas y conducción bajo efectos del alcohol."],
  RC_PROFESIONAL: ["Defensa legal e indemnizaciones por reclamos de clientes por errores u omisiones en tu trabajo.", "Actos dolosos, multas y trabajos fuera de tu profesión declarada."],
  SUSTRACCION: ["Robo o hurto con violencia de laptop, teléfono y equipos de trabajo declarados.", "Pérdidas por descuido, objetos no declarados y desgaste."],
};
const texto = (r: Ramo): [string, string] => TEXTOS[r] ?? [RAMOS[r].descripcion, "Ver condicionado de la póliza."];

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const codigo = (n: number) => Array.from({ length: n }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join("");

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.SEED_FORCE) {
    throw new Error("Seed bloqueado en producción. Usa SEED_FORCE=1 si de verdad quieres borrar y cargar datos demo.");
  }

  await db.$transaction([
    db.notificacion.deleteMany(), db.claveEmergencia.deleteMany(), db.siniestro.deleteMany(), db.pago.deleteMany(),
    db.poliza.deleteMany(), db.oferta.deleteMany(), db.solicitud.deleteMany(), db.perfil.deleteMany(), db.vinculo.deleteMany(),
    db.user.deleteMany(), db.intermediario.deleteMany(), db.aseguradora.deleteMany(),
  ]);

  const hash = await bcrypt.hash(CLAVE, 10);
  const base = { passwordHash: hash, aceptaTerminosAt: new Date() };

  await db.user.create({ data: { ...base, nombre: "Admin Perfila", email: "admin@demo.perfila.app", rol: "ADMIN", telefono: "04120000000" } });

  // Empresas
  const empresas = new Map<string, EmpresaDemo & { id: string }>();
  for (const e of EMPRESAS) {
    const creada = await db.aseguradora.create({
      data: {
        nombre: e.nombre, rif: e.rif, tipo: e.tipo, sigla: e.sigla, color: e.color, estado: e.estado ?? "APROBADA",
        siniestrosPagadosPct: e.pct || null, diasPromedioPago: e.dias || null,
        pagoMovilBanco: e.banco, pagoMovilTelefono: "04141234567",
        descripcion: `${e.nombre}: empresa ficticia para demostración.`,
      },
    });
    await db.user.create({
      data: { ...base, nombre: `Equipo ${e.nombre}`, email: e.email, rol: "ASEGURADORA", aseguradoraId: creada.id, telefono: "04241234567" },
    });
    empresas.set(e.clave, { ...e, id: creada.id });
  }

  // Intermediarios y sus vínculos con empresas
  const intermediarios = new Map<string, IntermediarioDemo & { id: string }>();
  for (const i of INTERMEDIARIOS) {
    const creado = await db.intermediario.create({
      data: { nombre: i.nombre, tipo: i.tipo, documento: i.documento, numeroAutorizacion: i.autorizacion, estado: i.estado ?? "APROBADA" },
    });
    await db.user.create({
      data: { ...base, nombre: i.contacto, email: i.email, rol: "INTERMEDIARIO", intermediarioId: creado.id, telefono: "04161234567" },
    });
    for (const v of i.vinculos) {
      await db.vinculo.create({ data: { intermediarioId: creado.id, aseguradoraId: empresas.get(v)!.id, estado: "APROBADO" } });
    }
    for (const v of i.pendientes ?? []) {
      await db.vinculo.create({ data: { intermediarioId: creado.id, aseguradoraId: empresas.get(v)!.id } });
    }
    intermediarios.set(i.clave, { ...i, id: creado.id });
  }

  // Combinaciones intermediario + empresa que pueden ofertar cada ramo
  const ofertantes = (ramo: Ramo) =>
    [...intermediarios.values()]
      .filter((i) => (i.estado ?? "APROBADA") === "APROBADA")
      .flatMap((i) => i.vinculos.map((v) => ({ i, e: empresas.get(v)! })))
      .filter(({ e }) => (e.estado ?? "APROBADA") === "APROBADA" && codigoRamo(ramo, e.tipo));

  async function ofertar(solicitudId: string, ramo: Ramo, datos: DatosPerfil, i: { id: string; factor: number }, e: EmpresaDemo & { id: string }, estado = "ENVIADA") {
    const [resumen, exclusiones] = texto(ramo);
    return db.oferta.create({
      data: {
        solicitudId, intermediarioId: i.id, aseguradoraId: e.id, ramo, estado, resumen, exclusiones,
        primaCents: Math.round(primaEstimada(ramo, datos) * e.precio * i.factor * 100),
        sumaAseguradaUsd: Math.round((RAMOS[ramo].sumaReferencialUsd * e.cobertura) / 100) * 100,
      },
    });
  }

  for (const [n, p] of PERSONAS.entries()) {
    const user = await db.user.create({
      data: { ...base, nombre: p.nombre, email: p.email, rol: "PERSONA", telefono: `0414${String(1000000 + n).padStart(7, "0")}` },
    });
    const fechaNacimiento = new Date(p.nac + "T12:00:00");
    const perfil = await db.perfil.create({
      data: {
        userId: user.id, codigo: codigo(5), fechaNacimiento, estadoResidencia: p.estado, ocupacion: p.ocupacion,
        vehiculo: p.vehiculo, dependientes: p.dep, salud: p.salud, presupuestoUsd: p.presupuesto,
      },
    });
    const datos: DatosPerfil = {
      edad: edadDesde(fechaNacimiento), ocupacion: p.ocupacion as Ocupacion, vehiculo: p.vehiculo as Vehiculo,
      dependientes: p.dep, salud: p.salud as Salud, presupuestoUsd: p.presupuesto,
    };
    const ramos = Array.from(new Set([...recomendar(datos), ...p.extra]));
    const creada = new Date(Date.now() - (n + 1) * 5 * 3600 * 1000);
    const solicitud = await db.solicitud.create({
      data: { perfilId: perfil.id, ramos: ramos.join(","), createdAt: creada, expiraAt: new Date(creada.getTime() + 7 * DIA) },
    });

    // Los primeros perfiles reciben más ofertas; los dos últimos ninguna (para ofertar en la demo)
    const maxPorRamo = Math.max(0, 4 - n);
    let total = 0;
    for (const ramo of ramos) {
      for (const { i, e } of ofertantes(ramo).slice(0, maxPorRamo)) {
        await ofertar(solicitud.id, ramo, datos, i, e);
        total++;
      }
    }
    if (total) {
      await db.notificacion.create({
        data: { userId: user.id, titulo: "¡Tienes ofertas nuevas!", mensaje: `Recibiste ${total} ofertas de corredores y agentes.`, link: "/app/ofertas" },
      });
    }

    // María: Medicina Prepagada activa (con una clave usada) y Vida activa
    if (p.email === "maria@demo.perfila.app") {
      const inicio = new Date(Date.now() - 20 * DIA);
      const contratos: [Ramo, string, string][] = [["MEDICINA_PREPAGADA", "pedro", "caribe"], ["VIDA_INDIVIDUAL", "corretaje", "avila"]];
      for (const [ramo, ic, ec] of contratos) {
        const e = empresas.get(ec)!;
        const existente = await db.oferta.findFirst({ where: { solicitudId: solicitud.id, ramo, intermediarioId: intermediarios.get(ic)!.id, aseguradoraId: e.id } });
        const oferta = existente ?? (await ofertar(solicitud.id, ramo, datos, intermediarios.get(ic)!, e));
        await db.oferta.update({ where: { id: oferta.id }, data: { estado: "ACEPTADA" } });
        await db.oferta.updateMany({ where: { solicitudId: solicitud.id, ramo, id: { not: oferta.id } }, data: { estado: "RECHAZADA" } });
        const poliza = await db.poliza.create({
          data: {
            numero: `PF-2026-${codigo(6)}`, ofertaId: oferta.id, userId: user.id, aseguradoraId: e.id, intermediarioId: oferta.intermediarioId,
            ramo, primaCents: oferta.primaCents, sumaAseguradaUsd: oferta.sumaAseguradaUsd,
            estado: "ACTIVA", inicio, pagadaHasta: new Date(inicio.getTime() + 30 * DIA),
          },
        });
        await db.pago.create({
          data: { polizaId: poliza.id, montoCents: oferta.primaCents, metodo: "PAGO_MOVIL", banco: "0134 Banesco", referencia: `00${codigo(4)}`, fechaPago: inicio, estado: "APROBADO", revisadoAt: inicio },
        });
        if (ramo === "MEDICINA_PREPAGADA") {
          const hace = new Date(Date.now() - 6 * DIA);
          await db.claveEmergencia.create({
            data: {
              polizaId: poliza.id, codigo: `EMG-${codigo(4)}-${codigo(4)}`, paciente: "María González", parentesco: "Titular",
              clinica: "Policlínica Metropolitana, Caracas", motivo: "Fiebre alta y dolor abdominal", telefono: "04141000001",
              estado: "UTILIZADA", venceAt: new Date(hace.getTime() + DIA), createdAt: hace,
            },
          });
        }
      }
    }

    // José: aceptó Accidentes Personales con Ana Martínez (Seguros Tepuy) y reportó el pago
    if (p.email === "jose@demo.perfila.app") {
      const oferta = await ofertar(solicitud.id, "ACCIDENTES_PERSONALES", datos, intermediarios.get("ana")!, empresas.get("tepuy")!, "ACEPTADA");
      const poliza = await db.poliza.create({
        data: {
          numero: `PF-2026-${codigo(6)}`, ofertaId: oferta.id, userId: user.id, aseguradoraId: oferta.aseguradoraId,
          intermediarioId: oferta.intermediarioId, ramo: "ACCIDENTES_PERSONALES", primaCents: oferta.primaCents,
          sumaAseguradaUsd: oferta.sumaAseguradaUsd,
        },
      });
      await db.pago.create({
        data: { polizaId: poliza.id, montoCents: oferta.primaCents, metodo: "PAGO_MOVIL", banco: "0105 Banco Mercantil", referencia: "778201", fechaPago: new Date() },
      });
    }
  }

  console.log(`✔ Datos demo cargados. Contraseña de todas las cuentas: ${CLAVE}`);
  console.log("  Persona:        luis@demo.perfila.app  (ofertas por elegir)");
  console.log("  Persona:        maria@demo.perfila.app (medicina prepagada activa → clave de emergencia)");
  console.log("  Intermediario:  corretaje@demo.perfila.app (sociedad de corretaje)");
  console.log("  Intermediario:  ana@demo.perfila.app (corredora)");
  console.log("  Empresa:        tepuy@demo.perfila.app (pago por verificar, vínculo por aprobar)");
  console.log("  Empresa:        saludcaribe@demo.perfila.app (medicina prepagada, claves)");
  console.log("  Admin:          admin@demo.perfila.app");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
