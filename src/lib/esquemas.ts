import * as z from "zod";
import {
  BANCOS, CODIGOS_RAMO, ESTADOS_VE, METODOS_PAGO, OCUPACIONES, PARENTESCOS, PRESUPUESTO_MAX, PRESUPUESTO_MIN, SALUD,
  TIPOS_EMPRESA, TIPOS_INTERMEDIARIO, VEHICULOS,
} from "./dominio";

export type EstadoForm = {
  errores?: Record<string, string[] | undefined>;
  mensaje?: string;
  ok?: boolean;
} | undefined;

const claves = <T extends Record<string, unknown>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

export const password = z
  .string()
  .min(8, { error: "Mínimo 8 caracteres." })
  .max(72, { error: "Máximo 72 caracteres." })
  .regex(/[a-zA-Z]/, { error: "Debe tener al menos una letra." })
  .regex(/[0-9]/, { error: "Debe tener al menos un número." });

const email = z.email({ error: "Correo inválido." }).trim().toLowerCase();
const telefono = z
  .string()
  .trim()
  .regex(/^(\+58|0)?4(12|14|16|22|24|26)\d{7}$/, { error: "Teléfono venezolano inválido (ej. 04141234567)." });

export const RegistroPersona = z.object({
  nombre: z.string().trim().min(2, { error: "Escribe tu nombre." }).max(80),
  email,
  telefono,
  password,
  terminos: z.literal("on", { error: "Debes aceptar los términos y la política de privacidad." }),
});

export const RegistroAseguradora = z.object({
  tipo: z.enum(claves(TIPOS_EMPRESA), { error: "Selecciona el tipo de empresa." }),
  empresa: z.string().trim().min(3, { error: "Nombre de la empresa requerido." }).max(100),
  rif: z.string().trim().toUpperCase().regex(/^J-?\d{8}-?\d$/, { error: "RIF inválido (ej. J-12345678-9)." }),
  nombre: z.string().trim().min(2, { error: "Nombre del responsable requerido." }).max(80),
  email,
  telefono,
  password,
  terminos: z.literal("on", { error: "Debes aceptar los términos." }),
});

export const RegistroIntermediario = z.object({
  tipo: z.enum(claves(TIPOS_INTERMEDIARIO), { error: "Selecciona el tipo de intermediario." }),
  razonSocial: z.string().trim().min(3, { error: "Nombre o razón social requerido." }).max(120),
  documento: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[VEJ]-?\d{6,9}(-?\d)?$/, { error: "Documento inválido (ej. V-12345678 o J-12345678-9)." }),
  numeroAutorizacion: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,20}$/, { error: "Número de autorización inválido." }),
  nombre: z.string().trim().min(2, { error: "Escribe tu nombre." }).max(80),
  email,
  telefono,
  password,
  terminos: z.literal("on", { error: "Debes aceptar los términos." }),
});

export const Ingreso = z.object({
  email,
  password: z.string().min(1, { error: "Escribe tu contraseña." }),
});

export const PerfilEsquema = z.object({
  fechaNacimiento: z.coerce.date({ error: "Fecha inválida." }),
  estadoResidencia: z.enum(ESTADOS_VE, { error: "Selecciona tu estado." }),
  ocupacion: z.enum(claves(OCUPACIONES), { error: "Selecciona tu ocupación." }),
  vehiculo: z.enum(claves(VEHICULOS), { error: "Selecciona una opción." }),
  dependientes: z.coerce.number().int().min(0).max(10),
  salud: z.enum(claves(SALUD), { error: "Selecciona una opción." }),
  presupuestoUsd: z.coerce.number().int().min(PRESUPUESTO_MIN).max(PRESUPUESTO_MAX),
  ramos: z.array(z.enum(CODIGOS_RAMO)).min(1, { error: "Elige al menos una cobertura." }),
});

export const OfertaEsquema = z.object({
  solicitudId: z.string().min(1),
  aseguradoraId: z.string().min(1, { error: "Selecciona la empresa que respalda la oferta." }),
  ramo: z.enum(CODIGOS_RAMO),
  primaUsd: z.coerce.number({ error: "Monto inválido." }).min(0.5, { error: "Mínimo $0,50." }).max(1000),
  sumaAseguradaUsd: z.coerce.number().int().min(100, { error: "Mínimo $100." }).max(1_000_000),
  resumen: z.string().trim().min(10, { error: "Explica qué cubre (mín. 10 caracteres)." }).max(600),
  exclusiones: z.string().trim().min(5, { error: "Indica las exclusiones principales." }).max(600),
});

export const PagoEsquema = z.object({
  polizaId: z.string().min(1),
  metodo: z.enum(claves(METODOS_PAGO)),
  banco: z.enum(BANCOS, { error: "Selecciona el banco." }),
  referencia: z.string().trim().regex(/^[0-9A-Za-z-]{4,30}$/, { error: "Referencia inválida." }),
  fechaPago: z.coerce.date({ error: "Fecha inválida." }),
});

export const SiniestroEsquema = z.object({
  polizaId: z.string().min(1),
  fechaOcurrencia: z.coerce.date({ error: "Fecha inválida." }),
  descripcion: z.string().trim().min(20, { error: "Cuéntanos qué pasó (mín. 20 caracteres)." }).max(2000),
  montoReclamadoUsd: z.coerce.number().min(1, { error: "Monto inválido." }).max(1_000_000),
});

export const ClaveEsquema = z.object({
  polizaId: z.string().min(1),
  paciente: z.string().trim().min(3, { error: "Escribe el nombre del paciente." }).max(100),
  parentesco: z.enum(PARENTESCOS, { error: "Selecciona el parentesco." }),
  clinica: z.string().trim().min(3, { error: "Indica la clínica o centro de salud." }).max(150),
  motivo: z.string().trim().min(5, { error: "Describe brevemente la emergencia." }).max(500),
  telefono,
});

export const ConfigAseguradoraEsquema = z.object({
  descripcion: z.string().trim().max(400).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, { error: "Color inválido." }),
  sigla: z.string().trim().min(1).max(3).toUpperCase(),
  siniestrosPagadosPct: z.coerce.number().int().min(0).max(100),
  diasPromedioPago: z.coerce.number().int().min(0).max(365),
  pagoMovilBanco: z.string().trim().max(60).optional().transform((v) => v || null),
  pagoMovilTelefono: z
    .string()
    .trim()
    .regex(/^(0?4(12|14|16|22|24|26)\d{7})?$/, { error: "Teléfono inválido." })
    .optional()
    .transform((v) => v || null),
  cuentaBancaria: z.string().trim().max(80).optional().transform((v) => v || null),
});

export function erroresDe(e: z.ZodError) {
  return z.flattenError(e).fieldErrors as Record<string, string[] | undefined>;
}
