import { expect, test, type Page } from "@playwright/test";

// Recorre el ciclo completo del marketplace:
// persona publica perfil → aseguradora oferta → persona acepta y paga →
// aseguradora confirma pago → persona reporta siniestro → aseguradora responde.
// Requiere la base con datos demo (npm run db:seed) y un build (npm run build).

const CLAVE = "Perfila2026";
const sufijo = Date.now().toString().slice(-7);
const persona = { nombre: "Prueba E2E", email: `e2e${sufijo}@test.perfila.app`, telefono: `0414${sufijo}` };

async function ingresar(page: Page, email: string, clave = CLAVE, esperarExito = true) {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(clave);
  await page.getByRole("button", { name: "Ingresar" }).click();
  if (esperarExito) await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"));
}

async function salir(page: Page) {
  await page.getByRole("button", { name: "Salir" }).click();
  await expect(page).toHaveURL("/");
}

test.describe.serial("flujo completo", () => {
  let codigoPerfil = "";

  test("persona se registra, crea su perfil y lo publica", async ({ page }) => {
    await page.goto("/registro");
    await page.getByLabel("Nombre").fill(persona.nombre);
    await page.getByLabel("Correo").fill(persona.email);
    await page.getByLabel("Teléfono").fill(persona.telefono);
    await page.getByLabel("Contraseña").fill("clave1234");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Crear cuenta gratis" }).click();

    await expect(page).toHaveURL(/\/app\/perfil\/crear/);
    await page.getByLabel("Fecha de nacimiento").fill("2001-05-10");
    await page.getByLabel("Estado").selectOption("Carabobo");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Repartidor o conductor de app" }).click();
    await page.getByRole("button", { name: "Moto propia" }).click();
    await page.getByRole("button", { name: "No", exact: true }).click();
    await page.getByRole("button", { name: "Buena, sin condiciones" }).click();
    await expect(page.getByRole("heading", { name: "¿Cuánto podrías pagar al mes?" })).toBeVisible();
    await page.getByRole("button", { name: "Continuar" }).click(); // presupuesto por defecto
    await expect(page.getByText("Esto es lo que te recomendamos")).toBeVisible();
    await page.getByRole("button", { name: "Publicar mi perfil y recibir ofertas" }).click();

    await expect(page).toHaveURL(/\/app\/ofertas\?publicado=1/);
    await expect(page.getByText("¡Tu perfil está publicado!")).toBeVisible();

    await page.goto("/app");
    const kpi = await page.getByText(/^#[A-Z0-9]{5}$/).textContent();
    codigoPerfil = kpi!.slice(1);
    expect(codigoPerfil).toHaveLength(5);
  });

  test("persona no puede entrar al panel de aseguradoras", async ({ page }) => {
    await ingresar(page, persona.email, "clave1234");
    await page.goto("/aseguradora/perfiles");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("aseguradora ve el perfil anónimo y envía una oferta", async ({ page }) => {
    await ingresar(page, "tepuy@demo.perfila.app");
    await expect(page).toHaveURL(/\/aseguradora$/);
    await page.goto("/aseguradora/perfiles?ocupacion=REPARTIDOR");
    const tarjeta = page.locator("div.rounded-2xl", { hasText: `Perfil #${codigoPerfil}` }).first();
    await expect(tarjeta).toBeVisible();
    // Anonimato: el nombre de la persona no aparece
    await expect(page.getByText(persona.nombre)).toHaveCount(0);

    const accidentes = tarjeta.locator("div.rounded-xl", { hasText: "Accidentes personales" }).first();
    await accidentes.getByRole("button", { name: "Enviar oferta" }).click();
    await accidentes.getByLabel("Prima mensual (USD)").fill("3.75");
    await accidentes.getByLabel("Qué no cubre").fill("Deportes extremos y accidentes bajo efectos del alcohol.");
    await accidentes.getByRole("button", { name: "Enviar oferta" }).click();
    await expect(accidentes.getByText("Oferta enviada")).toBeVisible();
    await salir(page);
  });

  test("persona recibe la notificación, acepta la oferta y reporta el pago", async ({ page }) => {
    await ingresar(page, persona.email, "clave1234");
    await page.goto("/notificaciones");
    await expect(page.getByText("¡Nueva oferta para ti!")).toBeVisible();

    await page.goto("/app/ofertas");
    const oferta = page.locator("div.rounded-2xl", { hasText: "Seguros Tepuy" }).filter({ hasText: "$3,75" }).first();
    await oferta.getByRole("button", { name: "Elegir esta oferta" }).click();
    await oferta.getByRole("button", { name: "Confirmar" }).click();

    await expect(page).toHaveURL(/\/app\/polizas\/.+\?nueva=1/);
    await expect(page.getByText("¡Tu póliza fue emitida!")).toBeVisible();
    await expect(page.getByText("Pendiente de pago").first()).toBeVisible();

    await page.getByLabel("Banco de origen").selectOption("Banesco");
    await page.getByLabel("Número de referencia").fill(`R${sufijo}`);
    await page.getByRole("button", { name: "Reportar pago" }).click();
    await expect(page.getByText("Registramos tu pago")).toBeVisible();
    await salir(page);
  });

  test("aseguradora confirma el pago y la póliza se activa", async ({ page }) => {
    await ingresar(page, "tepuy@demo.perfila.app");
    await page.goto("/aseguradora/polizas?tab=pagos");
    const pago = page.locator("div.rounded-2xl", { hasText: `R${sufijo}` });
    await expect(pago).toBeVisible();
    // Tras aceptar, la aseguradora sí ve los datos de contacto
    await expect(pago.getByText(persona.nombre, { exact: false })).toBeVisible();
    await pago.getByRole("button", { name: "✓ Confirmar pago" }).click();
    await expect(pago).toHaveCount(0);
    await salir(page);
  });

  test("persona con póliza activa reporta un siniestro", async ({ page }) => {
    await ingresar(page, persona.email, "clave1234");
    await page.goto("/app/polizas");
    await expect(page.getByText("Activa").first()).toBeVisible();
    await page.getByText("Accidentes personales").first().click();
    await page.getByLabel("¿Cuándo ocurrió?").fill(new Date().toLocaleDateString("en-CA"));
    await page.getByLabel("Monto que reclamas (USD)").fill("120");
    await page.getByLabel("¿Qué pasó?").fill("Caída de la moto en la avenida Bolívar durante una entrega, esguince de tobillo.");
    await page.getByRole("button", { name: "Enviar reporte" }).click();
    await expect(page.getByText("Reporte enviado")).toBeVisible();
    await salir(page);
  });

  test("aseguradora aprueba el siniestro", async ({ page }) => {
    await ingresar(page, "tepuy@demo.perfila.app");
    await page.goto("/aseguradora/siniestros");
    const s = page.locator("div.rounded-2xl", { hasText: "avenida Bolívar" }).first();
    await s.getByRole("combobox").selectOption("APROBADO");
    await s.getByPlaceholder("Mensaje para el asegurado").fill("Aprobado. Transferiremos el reembolso en 48 h.");
    await s.getByRole("button", { name: "Actualizar" }).click();
    await expect(s.getByText("Aprobado").first()).toBeVisible();
  });

  test("admin aprueba una aseguradora pendiente", async ({ page }) => {
    await ingresar(page, "admin@demo.perfila.app");
    await page.goto("/admin/aseguradoras");
    const fila = page.locator("div.rounded-2xl", { hasText: "Seguros Caribe Nuevo" });
    if (await fila.getByRole("button", { name: "Aprobar" }).count()) {
      await fila.getByRole("button", { name: "Aprobar" }).click();
    }
    await expect(fila.getByText("Aprobada")).toBeVisible();
  });

  test("credenciales incorrectas muestran error", async ({ page }) => {
    await ingresar(page, "luis@demo.perfila.app", "incorrecta1", false);
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });
});
