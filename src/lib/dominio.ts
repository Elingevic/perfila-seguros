// Reglas y catálogos del negocio. Se usa en servidor y cliente.
// Los catálogos de ramos, sujetos regulados, bancos y parentescos replican los
// catálogos oficiales de la SUDEASEG (copiados como datos fijos; la app no
// consulta la API en tiempo de ejecución).

export const ROLES = ["PERSONA", "INTERMEDIARIO", "ASEGURADORA", "ADMIN"] as const;
export type Rol = (typeof ROLES)[number];

export const RUTA_INICIO: Record<Rol, string> = {
  PERSONA: "/app",
  INTERMEDIARIO: "/intermediario",
  ASEGURADORA: "/aseguradora",
  ADMIN: "/admin",
};

// ---------------------------------------------------------------------------
// Sujetos regulados (catálogo regulated_subject_type)
// ---------------------------------------------------------------------------
export const TIPOS_EMPRESA = {
  SEGUROS: { nombre: "Empresa de Seguros", codigoSudeaseg: 26 },
  MEDICINA_PREPAGADA: { nombre: "Empresa de Medicina Prepagada", codigoSudeaseg: 28 },
  ADMINISTRADORA_RIESGOS: { nombre: "Empresa Administradora de Riesgos", codigoSudeaseg: 29 },
  COOPERATIVA: { nombre: "Asociación Cooperativa", codigoSudeaseg: 31 },
} as const;
export type TipoEmpresa = keyof typeof TIPOS_EMPRESA;

export const TIPOS_INTERMEDIARIO = {
  AGENTE: { nombre: "Agente de Seguros", codigoSudeaseg: 15, empresas: ["SEGUROS", "ADMINISTRADORA_RIESGOS"] },
  CORREDOR: { nombre: "Corredor de Seguros", codigoSudeaseg: 16, empresas: ["SEGUROS", "ADMINISTRADORA_RIESGOS", "COOPERATIVA"] },
  SOCIEDAD_CORRETAJE: {
    nombre: "Sociedad de Corretaje de Seguros y Medicina Prepagada",
    codigoSudeaseg: 36,
    empresas: ["SEGUROS", "MEDICINA_PREPAGADA", "ADMINISTRADORA_RIESGOS", "COOPERATIVA"],
  },
  AGENTE_MEDICINA_PREPAGADA: { nombre: "Agente de Medicina Prepagada", codigoSudeaseg: 19, empresas: ["MEDICINA_PREPAGADA"] },
  AGENTE_COOPERATIVA: { nombre: "Agente de Cooperativa", codigoSudeaseg: 20, empresas: ["COOPERATIVA"] },
} as const satisfies Record<string, { nombre: string; codigoSudeaseg: number; empresas: readonly TipoEmpresa[] }>;
export type TipoIntermediario = keyof typeof TIPOS_INTERMEDIARIO;

export function puedeRepresentar(tipoIntermediario: TipoIntermediario, tipoEmpresa: TipoEmpresa) {
  return (TIPOS_INTERMEDIARIO[tipoIntermediario].empresas as readonly TipoEmpresa[]).includes(tipoEmpresa);
}

// ---------------------------------------------------------------------------
// Ramos (catálogo accounting_coverage). Cada ramo indica el código contable
// con el que lo opera cada tipo de empresa.
// ---------------------------------------------------------------------------
type CodigoRamo = { codigo: string; nombre: string };

export const GRUPOS_RAMO = {
  PERSONAS: "Personas",
  VEHICULOS: "Vehículos",
  PATRIMONIO: "Patrimonio y otros",
} as const;

export const RAMOS = {
  ACCIDENTES_PERSONALES: {
    nombre: "Accidentes Personales", icono: "🩹", grupo: "PERSONAS", baseUsd: 2.5, sumaReferencialUsd: 5000,
    descripcion: "Gastos médicos, incapacidad o muerte por accidente.",
    codigos: {
      SEGUROS: { codigo: "06", nombre: "Accidentes Personales" },
      ADMINISTRADORA_RIESGOS: { codigo: "01", nombre: "Accidentes Personales" },
      COOPERATIVA: { codigo: "02", nombre: "Accidentes Personales" },
    },
  },
  MEDICINA_PREPAGADA: {
    nombre: "Medicina Prepagada", icono: "🚑", grupo: "PERSONAS", baseUsd: 5, sumaReferencialUsd: 2000,
    descripcion: "Consultas, emergencias y atención ambulatoria en red de clínicas. Incluye clave de emergencia.",
    codigos: { MEDICINA_PREPAGADA: { codigo: "01", nombre: "Servicios Médicos Asistenciales" } },
  },
  SALUD: {
    nombre: "Salud (HCM)", icono: "🏥", grupo: "PERSONAS", baseUsd: 16, sumaReferencialUsd: 5000,
    descripcion: "Hospitalización, cirugía y maternidad.",
    codigos: {
      SEGUROS: { codigo: "07", nombre: "Salud" },
      ADMINISTRADORA_RIESGOS: { codigo: "02", nombre: "Salud" },
      COOPERATIVA: { codigo: "03", nombre: "Hospitalización" },
    },
  },
  VIDA_INDIVIDUAL: {
    nombre: "Vida Individual", icono: "❤️", grupo: "PERSONAS", baseUsd: 3, sumaReferencialUsd: 10000,
    descripcion: "Si falleces, quien depende de ti recibe dinero para salir adelante.",
    codigos: {
      SEGUROS: { codigo: "01", nombre: "Vida Individual" },
      COOPERATIVA: { codigo: "01", nombre: "Vida" },
    },
  },
  ENFERMEDADES_GRAVES: {
    nombre: "Enfermedades Graves", icono: "🩺", grupo: "PERSONAS", baseUsd: 4, sumaReferencialUsd: 15000,
    descripcion: "Pago de un capital si te diagnostican una enfermedad grave o crítica.",
    codigos: { SEGUROS: { codigo: "10", nombre: "Pago de Capital por Enfermedades Graves o Críticas" } },
  },
  FUNERARIOS: {
    nombre: "Servicios Funerarios", icono: "🕊️", grupo: "PERSONAS", baseUsd: 1.5, sumaReferencialUsd: 1500,
    descripcion: "Cubre los servicios funerarios para ti y tu familia.",
    codigos: {
      SEGUROS: { codigo: "08", nombre: "Funerarios Servicios" },
      ADMINISTRADORA_RIESGOS: { codigo: "03", nombre: "Funerarios Servicios" },
      COOPERATIVA: { codigo: "04", nombre: "Funerarios" },
    },
  },
  RC_VEHICULOS: {
    nombre: "Responsabilidad Civil de Vehículos (RCV)", icono: "🛵", grupo: "VEHICULOS", baseUsd: 2, sumaReferencialUsd: 3000,
    descripcion: "Obligatorio para circular. Cubre los daños que causes a terceros.",
    codigos: {
      SEGUROS: { codigo: "31", nombre: "Responsabilidad Civil de Vehículos" },
      COOPERATIVA: { codigo: "06", nombre: "Responsabilidad Civil de Automóviles" },
    },
  },
  AUTOMOVIL_CASCO: {
    nombre: "Automóvil Casco", icono: "🚗", grupo: "VEHICULOS", baseUsd: 12, sumaReferencialUsd: 8000,
    descripcion: "Daños a tu propio vehículo por choque, robo o pérdida total.",
    codigos: {
      SEGUROS: { codigo: "20", nombre: "Automóvil Casco" },
      ADMINISTRADORA_RIESGOS: { codigo: "04", nombre: "Automóvil Casco" },
      COOPERATIVA: { codigo: "05", nombre: "Automóvil Casco" },
    },
  },
  RC_PROFESIONAL: {
    nombre: "Responsabilidad Civil Profesional", icono: "💼", grupo: "PATRIMONIO", baseUsd: 6, sumaReferencialUsd: 10000,
    descripcion: "Te protege si un cliente te reclama por errores en tu trabajo profesional.",
    codigos: { SEGUROS: { codigo: "35", nombre: "Responsabilidad Civil Profesional" } },
  },
  SUSTRACCION: {
    nombre: "Sustracción Ilegítima", icono: "💻", grupo: "PATRIMONIO", baseUsd: 3, sumaReferencialUsd: 1500,
    descripcion: "Robo o hurto de tus equipos y pertenencias (laptop, teléfono, herramientas).",
    codigos: { SEGUROS: { codigo: "14", nombre: "Sustracción Ilegítima" } },
  },
  ASISTENCIA_VIAJES: {
    nombre: "Asistencia en Viajes", icono: "✈️", grupo: "PATRIMONIO", baseUsd: 3, sumaReferencialUsd: 30000,
    descripcion: "Atención médica y asistencia cuando viajas fuera de tu ciudad o del país.",
    codigos: { SEGUROS: { codigo: "29", nombre: "Asistencia en Viajes" } },
  },
} as const satisfies Record<
  string,
  {
    nombre: string; icono: string; grupo: keyof typeof GRUPOS_RAMO; baseUsd: number; sumaReferencialUsd: number;
    descripcion: string; codigos: Partial<Record<TipoEmpresa, CodigoRamo>>;
  }
>;
export type Ramo = keyof typeof RAMOS;
export const CODIGOS_RAMO = Object.keys(RAMOS) as Ramo[];

export function esRamo(v: string): v is Ramo {
  return v in RAMOS;
}

export function parseRamos(csv: string): Ramo[] {
  return csv.split(",").filter(esRamo);
}

/** Código contable con el que una empresa de cierto tipo opera el ramo (o null si no puede). */
export function codigoRamo(ramo: Ramo, tipoEmpresa: TipoEmpresa): CodigoRamo | null {
  return (RAMOS[ramo].codigos as Partial<Record<TipoEmpresa, CodigoRamo>>)[tipoEmpresa] ?? null;
}

/** Ramos que puede ofrecer una empresa según su tipo. */
export function ramosDeEmpresa(tipoEmpresa: TipoEmpresa): Ramo[] {
  return CODIGOS_RAMO.filter((r) => codigoRamo(r, tipoEmpresa));
}

/** Ramos que dan derecho a solicitar clave de emergencia. */
export const RAMOS_CON_CLAVE: Ramo[] = ["MEDICINA_PREPAGADA"];

// ---------------------------------------------------------------------------
// Catálogos del perfil
// ---------------------------------------------------------------------------
export const OCUPACIONES = {
  EMPLEADO: "Empleado sin seguro de empresa",
  FREELANCE: "Freelance / trabajo remoto",
  REPARTIDOR: "Repartidor o conductor de app",
  EMPRENDEDOR: "Emprendedor / comercio",
  ESTUDIANTE: "Estudiante",
  OTRO: "Otro",
} as const;
export type Ocupacion = keyof typeof OCUPACIONES;

export const VEHICULOS = {
  MOTO: "Moto propia",
  CARRO: "Carro propio",
  NINGUNO: "Transporte público / a pie",
} as const;
export type Vehiculo = keyof typeof VEHICULOS;

export const SALUD = {
  BUENA: "Buena, sin condiciones",
  CONTROLADA: "Tengo una condición controlada",
  NO_DECLARA: "Prefiero no decir",
} as const;
export type Salud = keyof typeof SALUD;

export const ESTADOS_VE = [
  "Amazonas", "Anzoátegui", "Apure", "Aragua", "Barinas", "Bolívar", "Carabobo", "Cojedes",
  "Delta Amacuro", "Distrito Capital", "Falcón", "Guárico", "La Guaira", "Lara", "Mérida",
  "Miranda", "Monagas", "Nueva Esparta", "Portuguesa", "Sucre", "Táchira", "Trujillo",
  "Yaracuy", "Zulia",
] as const;

/** Catálogo relationship. */
export const PARENTESCOS = [
  "Titular", "Cónyuge", "Hijo(a)", "Padres", "Hermano(a)", "Abuelo(a)", "Nieto(a)", "Tío(a)", "Sobrino(a)", "Primo(a)",
  "Suegro(a)", "Yerno(a)", "Otros",
] as const;

export const PRESUPUESTO_MIN = 3;
export const PRESUPUESTO_MAX = 100;

// ---------------------------------------------------------------------------
// Estados
// ---------------------------------------------------------------------------
export const ESTADO_POLIZA = {
  PENDIENTE_PAGO: { label: "Pendiente de pago", tono: "amber" },
  ACTIVA: { label: "Activa", tono: "green" },
  CANCELADA: { label: "Cancelada", tono: "gray" },
} as const;

export const ESTADO_OFERTA = {
  ENVIADA: { label: "Enviada", tono: "blue" },
  ACEPTADA: { label: "Aceptada", tono: "green" },
  RECHAZADA: { label: "No elegida", tono: "gray" },
  RETIRADA: { label: "Retirada", tono: "gray" },
} as const;

export const ESTADO_PAGO = {
  EN_REVISION: { label: "En revisión", tono: "amber" },
  APROBADO: { label: "Aprobado", tono: "green" },
  RECHAZADO: { label: "Rechazado", tono: "red" },
} as const;

export const ESTADO_SINIESTRO = {
  REPORTADO: { label: "Reportado", tono: "blue" },
  EN_REVISION: { label: "En revisión", tono: "amber" },
  APROBADO: { label: "Aprobado", tono: "green" },
  RECHAZADO: { label: "Rechazado", tono: "red" },
  PAGADO: { label: "Pagado", tono: "green" },
} as const;

/** Estado de aprobación de empresas, intermediarios y vínculos. */
export const ESTADO_REGISTRO = {
  PENDIENTE: { label: "Pendiente", tono: "amber" },
  APROBADA: { label: "Aprobada", tono: "green" },
  SUSPENDIDA: { label: "Suspendida", tono: "red" },
} as const;
export const ESTADO_ASEGURADORA = ESTADO_REGISTRO;

export const ESTADO_VINCULO = {
  PENDIENTE: { label: "Por aprobar", tono: "amber" },
  APROBADO: { label: "Aprobado", tono: "green" },
  RECHAZADO: { label: "Rechazado", tono: "red" },
} as const;

export const ESTADO_CLAVE = {
  EMITIDA: { label: "Vigente", tono: "green" },
  UTILIZADA: { label: "Utilizada", tono: "blue" },
  ANULADA: { label: "Anulada", tono: "gray" },
} as const;

/** Horas de vigencia de una clave de emergencia. */
export const HORAS_VIGENCIA_CLAVE = 24;

/** Catálogo payment_type (los que aplican al pago de primas en línea). */
export const METODOS_PAGO = {
  PAGO_MOVIL: "Pago móvil",
  TRANSFERENCIA: "Transferencia bancaria",
  TARJETA_DEBITO: "Tarjeta de débito",
  TARJETA_CREDITO: "Tarjeta de crédito",
} as const;
export type MetodoPago = keyof typeof METODOS_PAGO;

/** Catálogo bank. */
export const BANCOS = [
  "0102 Banco de Venezuela", "0104 Banco Venezolano de Crédito", "0105 Banco Mercantil", "0108 BBVA Provincial",
  "0114 Bancaribe", "0115 Banco Exterior", "0128 Banco Caroní", "0134 Banesco", "0137 Banco Sofitasa",
  "0138 Banco Plaza", "0146 Bangente", "0151 Banco Fondo Común", "0156 100% Banco", "0157 DelSur Banco Universal",
  "0163 Banco del Tesoro", "0168 Bancrecer", "0169 R4 Banco Microfinanciero", "0171 Banco Activo",
  "0172 Bancamiga Banco Universal", "0173 Banco Internacional de Desarrollo", "0174 Banplus",
  "0175 Banco Digital de los Trabajadores", "0177 Banfanb", "0178 N58 Banco Digital", "0191 Banco Nacional de Crédito",
] as const;

/** Días que una solicitud queda abierta recibiendo ofertas. */
export const DIAS_SOLICITUD_ABIERTA = 7;

// ---------------------------------------------------------------------------
// Lógica de recomendación y estimación
// ---------------------------------------------------------------------------
export type DatosPerfil = {
  edad: number;
  ocupacion: Ocupacion;
  vehiculo: Vehiculo;
  dependientes: number;
  salud: Salud;
  presupuestoUsd: number;
};

export function recomendar(p: DatosPerfil): Ramo[] {
  const rec: Ramo[] = ["ACCIDENTES_PERSONALES"];
  if (p.vehiculo !== "NINGUNO") rec.push("RC_VEHICULOS");
  if (p.dependientes > 0) rec.push("VIDA_INDIVIDUAL");
  rec.push(p.presupuestoUsd >= 25 ? "SALUD" : "MEDICINA_PREPAGADA");
  if (p.ocupacion === "FREELANCE" && p.presupuestoUsd >= 20) rec.push("RC_PROFESIONAL");
  return rec;
}

export function motivoRecomendacion(ramo: Ramo, p: DatosPerfil): string | null {
  switch (ramo) {
    case "ACCIDENTES_PERSONALES":
      return p.ocupacion === "REPARTIDOR"
        ? "Pasas horas en la calle: es tu cobertura más importante."
        : "La base de todo plan: económica y te protege del imprevisto más común.";
    case "RC_VEHICULOS":
      return p.vehiculo !== "NINGUNO" ? "Tienes vehículo: el RCV es obligatorio y te evita pagar daños a terceros." : null;
    case "VIDA_INDIVIDUAL":
      return p.dependientes > 0 ? "Hay personas que dependen económicamente de ti." : null;
    case "SALUD":
      return p.presupuestoUsd >= 25 ? "Tu presupuesto permite cubrir hospitalización y cirugía." : null;
    case "MEDICINA_PREPAGADA":
      return p.presupuestoUsd < 25 ? "Accesible y con clave de emergencia para que te atiendan rápido." : null;
    case "RC_PROFESIONAL":
      return p.ocupacion === "FREELANCE" ? "Trabajas por tu cuenta: te protege ante reclamos de clientes." : null;
    default:
      return null;
  }
}

/** Prima mensual referencial (USD). Solo orientativa: la real la define cada oferta. */
export function primaEstimada(ramo: Ramo, p: DatosPerfil): number {
  let f = 1;
  if (ramo === "VIDA_INDIVIDUAL" || ramo === "ENFERMEDADES_GRAVES") f *= 1 + Math.max(0, p.edad - 25) * 0.04;
  if (ramo === "SALUD" || ramo === "MEDICINA_PREPAGADA") f *= 1 + Math.max(0, p.edad - 25) * 0.03;
  if (ramo === "ACCIDENTES_PERSONALES") {
    if (p.ocupacion === "REPARTIDOR") f *= 1.6;
    else if (p.vehiculo === "MOTO") f *= 1.3;
  }
  if ((ramo === "RC_VEHICULOS" || ramo === "AUTOMOVIL_CASCO") && p.vehiculo === "CARRO") f *= 2.2;
  if (p.salud === "CONTROLADA" && (ramo === "SALUD" || ramo === "VIDA_INDIVIDUAL" || ramo === "ENFERMEDADES_GRAVES")) f *= 1.2;
  return Math.round(RAMOS[ramo].baseUsd * f * 100) / 100;
}

export function edadDesde(fechaNacimiento: Date, hoy = new Date()): number {
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - fechaNacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) edad--;
  return edad;
}

// ---------------------------------------------------------------------------
// Formato y fechas
// ---------------------------------------------------------------------------
export function usd(cents: number) {
  return "$" + (cents / 100).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function usdEntero(monto: number) {
  return "$" + monto.toLocaleString("es-VE");
}

export function fecha(d: Date) {
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric", timeZone: ZONA_HORARIA });
}

export function fechaHora(d: Date) {
  return d.toLocaleString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: ZONA_HORARIA });
}

export function haceCuanto(d: Date, ahora = new Date()) {
  const min = Math.round((ahora.getTime() - d.getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.round(h / 24);
  return `hace ${dias} día${dias === 1 ? "" : "s"}`;
}

/** ¿La fecha ocurrió hace menos de `horas` horas? */
export function esReciente(d: Date, horas = 24) {
  return Date.now() - d.getTime() < horas * 3600 * 1000;
}

/** ¿La fecha vence dentro de los próximos `dias` días (o ya venció)? */
export function vencePronto(d: Date, dias = 7) {
  return d.getTime() - Date.now() < dias * 24 * 3600 * 1000;
}

/** ¿La fecha ya pasó? */
export function vencida(d: Date) {
  return d.getTime() < Date.now();
}

export const ZONA_HORARIA = "America/Caracas";

/** Fecha calendario (YYYY-MM-DD) en hora de Venezuela. */
export function diaVE(d: Date = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

/** Fecha calendario (YYYY-MM-DD) de un valor de <input type="date">, que llega como medianoche UTC. */
export function diaInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Vencimiento usado por los perfiles de demostración: nunca vencen en la práctica. */
export const FECHA_SIN_VENCIMIENTO = new Date("2099-12-31T00:00:00Z");

export function sinVencimiento(d: Date) {
  return d.getTime() >= FECHA_SIN_VENCIMIENTO.getTime();
}

/** "hasta el 06 nov. 2026" o "sin fecha de vencimiento". */
export function vigenciaSolicitud(d: Date) {
  return sinVencimiento(d) ? "sin fecha de vencimiento" : `hasta el ${fecha(d)}`;
}
