-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" TEXT NOT NULL,
    "aseguradoraId" TEXT,
    "intermediarioId" TEXT,
    "aceptaTerminosAt" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aseguradora" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rif" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'SEGUROS',
    "sigla" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#1d4ed8',
    "descripcion" TEXT,
    "siniestrosPagadosPct" INTEGER,
    "diasPromedioPago" INTEGER,
    "pagoMovilBanco" TEXT,
    "pagoMovilTelefono" TEXT,
    "cuentaBancaria" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aseguradora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intermediario" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "numeroAutorizacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intermediario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vinculo" (
    "id" TEXT NOT NULL,
    "intermediarioId" TEXT NOT NULL,
    "aseguradoraId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Perfil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3) NOT NULL,
    "estadoResidencia" TEXT NOT NULL,
    "ocupacion" TEXT NOT NULL,
    "vehiculo" TEXT NOT NULL,
    "dependientes" INTEGER NOT NULL,
    "salud" TEXT NOT NULL,
    "presupuestoUsd" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "perfilId" TEXT NOT NULL,
    "ramos" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "expiraAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Oferta" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "intermediarioId" TEXT NOT NULL,
    "aseguradoraId" TEXT NOT NULL,
    "ramo" TEXT NOT NULL,
    "primaCents" INTEGER NOT NULL,
    "sumaAseguradaUsd" INTEGER NOT NULL,
    "resumen" TEXT NOT NULL,
    "exclusiones" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ENVIADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Oferta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poliza" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "ofertaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aseguradoraId" TEXT NOT NULL,
    "intermediarioId" TEXT NOT NULL,
    "ramo" TEXT NOT NULL,
    "primaCents" INTEGER NOT NULL,
    "sumaAseguradaUsd" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "inicio" TIMESTAMP(3),
    "pagadaHasta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poliza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "polizaId" TEXT NOT NULL,
    "montoCents" INTEGER NOT NULL,
    "metodo" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "referencia" TEXT NOT NULL,
    "fechaPago" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EN_REVISION',
    "nota" TEXT,
    "revisadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siniestro" (
    "id" TEXT NOT NULL,
    "polizaId" TEXT NOT NULL,
    "fechaOcurrencia" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoReclamadoCents" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'REPORTADO',
    "respuesta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Siniestro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaveEmergencia" (
    "id" TEXT NOT NULL,
    "polizaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "paciente" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "clinica" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'EMITIDA',
    "venceAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaveEmergencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "link" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_aseguradoraId_idx" ON "User"("aseguradoraId");

-- CreateIndex
CREATE INDEX "User_intermediarioId_idx" ON "User"("intermediarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Aseguradora_nombre_key" ON "Aseguradora"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Aseguradora_rif_key" ON "Aseguradora"("rif");

-- CreateIndex
CREATE UNIQUE INDEX "Intermediario_documento_key" ON "Intermediario"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "Intermediario_numeroAutorizacion_key" ON "Intermediario"("numeroAutorizacion");

-- CreateIndex
CREATE INDEX "Vinculo_aseguradoraId_estado_idx" ON "Vinculo"("aseguradoraId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Vinculo_intermediarioId_aseguradoraId_key" ON "Vinculo"("intermediarioId", "aseguradoraId");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_userId_key" ON "Perfil"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Perfil_codigo_key" ON "Perfil"("codigo");

-- CreateIndex
CREATE INDEX "Solicitud_estado_createdAt_idx" ON "Solicitud"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "Solicitud_perfilId_idx" ON "Solicitud"("perfilId");

-- CreateIndex
CREATE INDEX "Oferta_intermediarioId_estado_idx" ON "Oferta"("intermediarioId", "estado");

-- CreateIndex
CREATE INDEX "Oferta_aseguradoraId_estado_idx" ON "Oferta"("aseguradoraId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "Oferta_solicitudId_intermediarioId_aseguradoraId_ramo_key" ON "Oferta"("solicitudId", "intermediarioId", "aseguradoraId", "ramo");

-- CreateIndex
CREATE UNIQUE INDEX "Poliza_numero_key" ON "Poliza"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Poliza_ofertaId_key" ON "Poliza"("ofertaId");

-- CreateIndex
CREATE INDEX "Poliza_userId_idx" ON "Poliza"("userId");

-- CreateIndex
CREATE INDEX "Poliza_aseguradoraId_estado_idx" ON "Poliza"("aseguradoraId", "estado");

-- CreateIndex
CREATE INDEX "Poliza_intermediarioId_idx" ON "Poliza"("intermediarioId");

-- CreateIndex
CREATE INDEX "Pago_polizaId_idx" ON "Pago"("polizaId");

-- CreateIndex
CREATE INDEX "Pago_estado_idx" ON "Pago"("estado");

-- CreateIndex
CREATE INDEX "Siniestro_polizaId_idx" ON "Siniestro"("polizaId");

-- CreateIndex
CREATE INDEX "Siniestro_estado_idx" ON "Siniestro"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "ClaveEmergencia_codigo_key" ON "ClaveEmergencia"("codigo");

-- CreateIndex
CREATE INDEX "ClaveEmergencia_polizaId_idx" ON "ClaveEmergencia"("polizaId");

-- CreateIndex
CREATE INDEX "ClaveEmergencia_estado_idx" ON "ClaveEmergencia"("estado");

-- CreateIndex
CREATE INDEX "Notificacion_userId_leida_idx" ON "Notificacion"("userId", "leida");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_aseguradoraId_fkey" FOREIGN KEY ("aseguradoraId") REFERENCES "Aseguradora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_intermediarioId_fkey" FOREIGN KEY ("intermediarioId") REFERENCES "Intermediario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_intermediarioId_fkey" FOREIGN KEY ("intermediarioId") REFERENCES "Intermediario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_aseguradoraId_fkey" FOREIGN KEY ("aseguradoraId") REFERENCES "Aseguradora"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Perfil" ADD CONSTRAINT "Perfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "Perfil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_intermediarioId_fkey" FOREIGN KEY ("intermediarioId") REFERENCES "Intermediario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Oferta" ADD CONSTRAINT "Oferta_aseguradoraId_fkey" FOREIGN KEY ("aseguradoraId") REFERENCES "Aseguradora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "Oferta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_aseguradoraId_fkey" FOREIGN KEY ("aseguradoraId") REFERENCES "Aseguradora"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poliza" ADD CONSTRAINT "Poliza_intermediarioId_fkey" FOREIGN KEY ("intermediarioId") REFERENCES "Intermediario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "Poliza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siniestro" ADD CONSTRAINT "Siniestro_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "Poliza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClaveEmergencia" ADD CONSTRAINT "ClaveEmergencia_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "Poliza"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

