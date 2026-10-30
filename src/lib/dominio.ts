// Reglas y catálogos del negocio. Se usa en servidor y cliente.

export const ROLES = ["PERSONA", "ASEGURADORA", "ADMIN"] as const;
export type Rol = (typeof ROLES)[number];

export const RUTA_INICIO: Record<Rol, string> = {
  PERSONA: "/app",
  ASEGURADORA: "/aseguradora",
  ADMIN: "/admin",
};

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------
export const PRODUCTOS = {
  ACCIDENTES: {
    nombre: "Accidentes personales",
    corto: "Accidentes",
    icono: "🩹",
    descripcion: "Te paga gastos médicos, incapacidad o muerte por accidente.",
    baseUsd: 2.5,
    sumaReferencialUsd: 5000,
  },
  RCV: {
    nombre: "RCV de vehículo",
    corto: "RCV",
    icono: "🛵",
    descripcion: "Obligatorio para circular. Cubre los daños que causes a terceros.",
    baseUsd: 2,
    sumaReferencialUsd: 3000,
  },
  VIDA: {
    nombre: "Vida básico",
    corto: "Vida",
    icono: "❤️",
    descripcion: "Si falleces, quien depende de ti recibe dinero para salir adelante.",
    baseUsd: 3,
    sumaReferencialUsd: 10000,
  },
  EMERGENCIAS: {
    nombre: "Emergencias médicas",
    corto: "Emergencias",
    icono: "🚑",
    descripcion: "Ambulancia y atención de emergencia en clínicas afiliadas.",
    baseUsd: 5,
    sumaReferencialUsd: 2000,
  },
  HCM: {
    nombre: "Salud (HCM) básico",
    corto: "HCM",
    icono: "🏥",
    descripcion: "Hospitalización, cirugía y maternidad.",
    baseUsd: 16,
    sumaReferencialUsd: 5000,
  },
} as const;
export type Producto = keyof typeof PRODUCTOS;
export const CODIGOS_PRODUCTO = Object.keys(PRODUCTOS) as Producto[];

export function esProducto(v: string): v is Producto {
  return v in PRODUCTOS;
}

export function parseProductos(csv: string): Producto[] {
  return csv.split(",").filter(esProducto);
}

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

export const ESTADO_ASEGURADORA = {
  PENDIENTE: { label: "Pendiente", tono: "amber" },
  APROBADA: { label: "Aprobada", tono: "green" },
  SUSPENDIDA: { label: "Suspendida", tono: "red" },
} as const;

export const METODOS_PAGO = {
  PAGO_MOVIL: "Pago Móvil",
  TRANSFERENCIA: "Transferencia bancaria",
  TARJETA: "Tarjeta",
} as const;
export type MetodoPago = keyof typeof METODOS_PAGO;

export const BANCOS = [
  "Banco de Venezuela", "Banesco", "Mercantil", "Provincial", "Bancamiga", "Banco Nacional de Crédito",
  "Banco del Tesoro", "Bancaribe", "Banco Exterior", "Banco Plaza", "Banco Activo", "Bicentenario",
  "Banplus", "Sofitasa", "100% Banco", "Otro",
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

export function recomendar(p: DatosPerfil): Producto[] {
  const rec: Producto[] = ["ACCIDENTES"];
  if (p.vehiculo !== "NINGUNO") rec.push("RCV");
  if (p.dependientes > 0) rec.push("VIDA");
  rec.push(p.presupuestoUsd >= 25 ? "HCM" : "EMERGENCIAS");
  return rec;
}

export function motivoRecomendacion(prod: Producto, p: DatosPerfil): string | null {
  switch (prod) {
    case "ACCIDENTES":
      return p.ocupacion === "REPARTIDOR"
        ? "Pasas horas en la calle: es tu cobertura más importante."
        : "La base de todo plan: económica y te protege del imprevisto más común.";
    case "RCV":
      return p.vehiculo !== "NINGUNO" ? "Tienes vehículo: el RCV es obligatorio y te evita pagar daños a terceros." : null;
    case "VIDA":
      return p.dependientes > 0 ? "Hay personas que dependen económicamente de ti." : null;
    case "HCM":
      return p.presupuestoUsd >= 25 ? "Tu presupuesto permite cubrir hospitalización y cirugía." : null;
    case "EMERGENCIAS":
      return p.presupuestoUsd < 25 ? "Una opción accesible mientras no puedas pagar un HCM." : null;
  }
}

/** Prima mensual referencial (USD). Solo orientativa: la real la define cada aseguradora. */
export function primaEstimada(prod: Producto, p: DatosPerfil): number {
  let f = 1;
  if (prod === "VIDA") f *= 1 + Math.max(0, p.edad - 25) * 0.04;
  if (prod === "HCM") f *= 1 + Math.max(0, p.edad - 25) * 0.03;
  if (prod === "ACCIDENTES") {
    if (p.ocupacion === "REPARTIDOR") f *= 1.6;
    else if (p.vehiculo === "MOTO") f *= 1.3;
  }
  if (prod === "RCV" && p.vehiculo === "CARRO") f *= 2.2;
  if (p.salud === "CONTROLADA" && (prod === "HCM" || prod === "VIDA")) f *= 1.2;
  return Math.round(PRODUCTOS[prod].baseUsd * f * 100) / 100;
}

export function edadDesde(fechaNacimiento: Date, hoy = new Date()): number {
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - fechaNacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) edad--;
  return edad;
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------
export function usd(cents: number) {
  return "$" + (cents / 100).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function usdEntero(monto: number) {
  return "$" + monto.toLocaleString("es-VE");
}

export function fecha(d: Date) {
  return d.toLocaleDateString("es-VE", { day: "2-digit", month: "short", year: "numeric" });
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

export const ZONA_HORARIA = "America/Caracas";

/** Fecha calendario (YYYY-MM-DD) en hora de Venezuela. */
export function diaVE(d: Date = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: ZONA_HORARIA });
}

/** Fecha calendario (YYYY-MM-DD) de un valor de <input type="date">, que llega como medianoche UTC. */
export function diaInput(d: Date) {
  return d.toISOString().slice(0, 10);
}
