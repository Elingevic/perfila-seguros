// Datos de demostración. BORRA la base de datos antes de cargar.
// Uso: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  PRODUCTOS, edadDesde, primaEstimada, recomendar,
  type DatosPerfil, type Ocupacion, type Producto, type Salud, type Vehiculo,
} from "../src/lib/dominio";

const db = new PrismaClient();
const CLAVE = "Perfila2026";
const DIA = 24 * 3600 * 1000;

const ASEGURADORAS = [
  { nombre: "Seguros Tepuy", rif: "J-40000001-1", sigla: "ST", color: "#0ea5e9", precio: 1.0, cobertura: 1.0, pct: 94, dias: 12, banco: "Banesco", email: "tepuy@demo.perfila.app" },
  { nombre: "Morrocoy Seguros", rif: "J-40000002-2", sigla: "MS", color: "#f97316", precio: 0.86, cobertura: 0.8, pct: 88, dias: 19, banco: "Mercantil", email: "morrocoy@demo.perfila.app" },
  { nombre: "Ávila Aseguradora", rif: "J-40000003-3", sigla: "ÁA", color: "#16a34a", precio: 1.15, cobertura: 1.3, pct: 97, dias: 7, banco: "Banco de Venezuela", email: "avila@demo.perfila.app" },
  { nombre: "La Llanera Seguros", rif: "J-40000004-4", sigla: "LL", color: "#a855f7", precio: 0.95, cobertura: 1.0, pct: 91, dias: 14, banco: "Provincial", email: "llanera@demo.perfila.app" },
];

const PERSONAS = [
  { nombre: "Luis Pérez", email: "luis@demo.perfila.app", nac: "2002-03-14", estado: "Carabobo", ocupacion: "REPARTIDOR", vehiculo: "MOTO", dep: 0, salud: "BUENA", presupuesto: 10 },
  { nombre: "María González", email: "maria@demo.perfila.app", nac: "1997-08-02", estado: "Distrito Capital", ocupacion: "FREELANCE", vehiculo: "NINGUNO", dep: 1, salud: "BUENA", presupuesto: 35 },
  { nombre: "Andrea Rojas", email: "andrea@demo.perfila.app", nac: "2005-01-20", estado: "Lara", ocupacion: "ESTUDIANTE", vehiculo: "NINGUNO", dep: 0, salud: "BUENA", presupuesto: 6 },
  { nombre: "Carlos Medina", email: "carlos@demo.perfila.app", nac: "1993-11-09", estado: "Zulia", ocupacion: "EMPRENDEDOR", vehiculo: "CARRO", dep: 2, salud: "CONTROLADA", presupuesto: 45 },
  { nombre: "José Ramírez", email: "jose@demo.perfila.app", nac: "2000-06-30", estado: "Miranda", ocupacion: "EMPLEADO", vehiculo: "MOTO", dep: 0, salud: "BUENA", presupuesto: 15 },
  { nombre: "Daniela Torres", email: "daniela@demo.perfila.app", nac: "1999-04-11", estado: "Mérida", ocupacion: "FREELANCE", vehiculo: "NINGUNO", dep: 0, salud: "NO_DECLARA", presupuesto: 20 },
];

const RESUMEN: Record<Producto, [string, string]> = {
  ACCIDENTES: ["Gastos médicos por accidente, incapacidad total o parcial y muerte accidental, 24/7 en todo el país.", "Accidentes bajo efectos de alcohol o drogas, deportes extremos y lesiones previas a la póliza."],
  RCV: ["Daños a personas y bienes de terceros causados con tu vehículo, más asistencia legal.", "Daños a tu propio vehículo, conducción sin licencia y uso en competencias."],
  VIDA: ["Pago de la suma asegurada a tus beneficiarios por fallecimiento por cualquier causa.", "Suicidio durante el primer año y enfermedades preexistentes no declaradas."],
  EMERGENCIAS: ["Ambulancia, atención en emergencia y estabilización en clínicas afiliadas.", "Hospitalización prolongada, cirugías programadas y tratamientos crónicos."],
  HCM: ["Hospitalización, cirugía, maternidad (tras 10 meses) y exámenes asociados en red de clínicas.", "Preexistencias durante el primer año, tratamientos estéticos y odontología."],
};

const codigo = (n: number) => Array.from({ length: n }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.SEED_FORCE) {
    throw new Error("Seed bloqueado en producción. Usa SEED_FORCE=1 si de verdad quieres borrar y cargar datos demo.");
  }

  await db.$transaction([
    db.notificacion.deleteMany(), db.siniestro.deleteMany(), db.pago.deleteMany(), db.poliza.deleteMany(),
    db.oferta.deleteMany(), db.solicitud.deleteMany(), db.perfil.deleteMany(), db.user.deleteMany(), db.aseguradora.deleteMany(),
  ]);

  const hash = await bcrypt.hash(CLAVE, 10);
  const base = { passwordHash: hash, aceptaTerminosAt: new Date() };

  await db.user.create({ data: { ...base, nombre: "Admin Perfila", email: "admin@demo.perfila.app", rol: "ADMIN", telefono: "04120000000" } });

  const aseguradoras = [];
  for (const a of ASEGURADORAS) {
    const creada = await db.aseguradora.create({
      data: {
        nombre: a.nombre, rif: a.rif, sigla: a.sigla, color: a.color, estado: "APROBADA",
        siniestrosPagadosPct: a.pct, diasPromedioPago: a.dias,
        pagoMovilBanco: a.banco, pagoMovilTelefono: "04141234567",
        descripcion: `${a.nombre} — aseguradora ficticia para demostración.`,
      },
    });
    await db.user.create({
      data: { ...base, nombre: `Equipo ${a.nombre}`, email: a.email, rol: "ASEGURADORA", aseguradoraId: creada.id, telefono: "04241234567" },
    });
    aseguradoras.push({ ...a, id: creada.id });
  }

  // Una aseguradora pendiente de aprobación, para mostrar el flujo de admin
  const pendiente = await db.aseguradora.create({ data: { nombre: "Seguros Caribe Nuevo", rif: "J-40000005-5", sigla: "SC", color: "#e11d48" } });
  await db.user.create({ data: { ...base, nombre: "Equipo Caribe", email: "caribe@demo.perfila.app", rol: "ASEGURADORA", aseguradoraId: pendiente.id, telefono: "04161234567" } });

  for (const [i, p] of PERSONAS.entries()) {
    const user = await db.user.create({
      data: { ...base, nombre: p.nombre, email: p.email, rol: "PERSONA", telefono: `0414${String(1000000 + i).padStart(7, "0")}` },
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
    const productos = recomendar(datos);
    const creada = new Date(Date.now() - (i + 1) * 5 * 3600 * 1000);
    const solicitud = await db.solicitud.create({
      data: { perfilId: perfil.id, productos: productos.join(","), createdAt: creada, expiraAt: new Date(creada.getTime() + 7 * DIA) },
    });

    // Ofertas: los primeros perfiles reciben más ofertas; el último ninguna (para que las aseguradoras oferten en la demo)
    const ofertantes = aseguradoras.slice(0, Math.max(0, 4 - i));
    for (const a of ofertantes) {
      for (const prod of productos) {
        if ((a.sigla === "MS" && prod === "HCM") || (a.sigla === "ÁA" && prod === "RCV")) continue;
        await db.oferta.create({
          data: {
            solicitudId: solicitud.id, aseguradoraId: a.id, producto: prod,
            primaCents: Math.round(primaEstimada(prod, datos) * a.precio * 100),
            sumaAseguradaUsd: Math.round((PRODUCTOS[prod].sumaReferencialUsd * a.cobertura) / 100) * 100,
            resumen: RESUMEN[prod][0], exclusiones: RESUMEN[prod][1],
          },
        });
      }
    }
    if (ofertantes.length) {
      await db.notificacion.create({
        data: { userId: user.id, titulo: "¡Tienes ofertas nuevas!", mensaje: `${ofertantes.length} aseguradoras te enviaron ofertas.`, link: "/app/ofertas" },
      });
    }

    // María ya contrató Vida con Ávila y tiene la póliza activa
    if (p.email === "maria@demo.perfila.app") {
      const oferta = await db.oferta.findFirstOrThrow({ where: { solicitudId: solicitud.id, producto: "VIDA", aseguradora: { sigla: "ÁA" } } });
      await db.oferta.update({ where: { id: oferta.id }, data: { estado: "ACEPTADA" } });
      await db.oferta.updateMany({ where: { solicitudId: solicitud.id, producto: "VIDA", id: { not: oferta.id } }, data: { estado: "RECHAZADA" } });
      const inicio = new Date(Date.now() - 20 * DIA);
      const poliza = await db.poliza.create({
        data: {
          numero: `PF-2026-${codigo(6)}`, ofertaId: oferta.id, userId: user.id, aseguradoraId: oferta.aseguradoraId,
          producto: "VIDA", primaCents: oferta.primaCents, sumaAseguradaUsd: oferta.sumaAseguradaUsd,
          estado: "ACTIVA", inicio, pagadaHasta: new Date(inicio.getTime() + 30 * DIA),
        },
      });
      await db.pago.create({
        data: { polizaId: poliza.id, montoCents: oferta.primaCents, metodo: "PAGO_MOVIL", banco: "Banesco", referencia: "004512", fechaPago: inicio, estado: "APROBADO", revisadoAt: inicio },
      });
    }

    // José aceptó Accidentes con Tepuy y reportó el pago (pendiente de verificar)
    if (p.email === "jose@demo.perfila.app") {
      const a = aseguradoras[0];
      const oferta = await db.oferta.create({
        data: {
          solicitudId: solicitud.id, aseguradoraId: a.id, producto: "ACCIDENTES", estado: "ACEPTADA",
          primaCents: Math.round(primaEstimada("ACCIDENTES", datos) * 100), sumaAseguradaUsd: 5000,
          resumen: RESUMEN.ACCIDENTES[0], exclusiones: RESUMEN.ACCIDENTES[1],
        },
      });
      const poliza = await db.poliza.create({
        data: {
          numero: `PF-2026-${codigo(6)}`, ofertaId: oferta.id, userId: user.id, aseguradoraId: a.id,
          producto: "ACCIDENTES", primaCents: oferta.primaCents, sumaAseguradaUsd: 5000,
        },
      });
      await db.pago.create({
        data: { polizaId: poliza.id, montoCents: oferta.primaCents, metodo: "PAGO_MOVIL", banco: "Mercantil", referencia: "778201", fechaPago: new Date() },
      });
    }
  }

  console.log(`✔ Datos demo cargados. Contraseña de todas las cuentas: ${CLAVE}`);
  console.log("  Persona:      luis@demo.perfila.app  (ofertas por elegir)");
  console.log("  Persona:      maria@demo.perfila.app (póliza activa)");
  console.log("  Aseguradora:  tepuy@demo.perfila.app (pago por verificar)");
  console.log("  Pendiente:    caribe@demo.perfila.app");
  console.log("  Admin:        admin@demo.perfila.app");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
