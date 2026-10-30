import { expect, test, type Page } from "@playwright/test";

// Recorre el ciclo completo:
// persona publica perfil → intermediario oferta con respaldo de una empresa →
// persona acepta y paga → empresa confirma → persona pide clave de emergencia
// → empresa gestiona la clave → siniestro → vínculos y verificación del admin.
// Requiere la base con datos demo (npm run db:seed) y un build (npm run build).

const CLAVE = "Perfila2026";
const sufijo = Date.now().toString().slice(-7);
const persona = { nombre: "Prueba E2E", email: `e2e${sufijo}@test.perfila.app`, telefono: `0414${sufijo}` };
const hoy = () => new Date().toLocaleDateString("en-CA");

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

const tarjeta = (page: Page, texto: string) => page.locator("div.rounded-2xl", { hasText: texto }).first();

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
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Esto es lo que te recomendamos")).toBeVisible();
    await page.getByRole("button", { name: "Publicar mi perfil y recibir ofertas" }).click();

    await expect(page).toHaveURL(/\/app\/ofertas\?publicado=1/);
    await expect(page.getByText("¡Tu perfil está publicado!")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Medicina Prepagada" })).toBeVisible();

    await page.goto("/app");
    codigoPerfil = (await page.getByText(/^#[A-Z0-9]{5}$/).textContent())!.slice(1);
    expect(codigoPerfil).toHaveLength(5);

    // Sin póliza de medicina prepagada, el modal explica que la necesita
    await page.getByRole("button", { name: "🚑 Solicitar clave de emergencia" }).click();
    await expect(page.getByText("Necesitas una póliza de Medicina Prepagada")).toBeVisible();
    await page.getByRole("button", { name: "Cerrar" }).click();
  });

  test("persona no puede entrar a paneles de otros roles", async ({ page }) => {
    await ingresar(page, persona.email, "clave1234");
    await page.goto("/intermediario/perfiles");
    await expect(page).toHaveURL(/\/app$/);
    await page.goto("/aseguradora");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("intermediario oferta medicina prepagada respaldada por una empresa", async ({ page }) => {
    await ingresar(page, "corretaje@demo.perfila.app");
    await expect(page).toHaveURL(/\/intermediario$/);
    await page.goto("/intermediario/perfiles?ocupacion=REPARTIDOR");
    const perfil = tarjeta(page, `Perfil #${codigoPerfil}`);
    await expect(perfil).toBeVisible();
    await expect(page.getByText(persona.nombre)).toHaveCount(0); // anonimato

    const ramo = perfil.locator("div.rounded-xl", { hasText: "Medicina Prepagada" }).first();
    await ramo.getByRole("button", { name: "Enviar oferta" }).click();
    const empresa = ramo.getByLabel("Empresa que respalda la oferta");
    const valor = await empresa.locator("option", { hasText: "Salud Integral Caribe" }).getAttribute("value");
    await empresa.selectOption(valor!);
    await ramo.getByLabel("Prima mensual (USD)").fill("4.35");
    await ramo.getByLabel("Qué no cubre").fill("Hospitalización prolongada y cirugías programadas.");
    await ramo.getByRole("button", { name: "Enviar oferta" }).click();
    await expect(ramo.getByText("Oferta enviada")).toBeVisible();
    await salir(page);
  });

  test("persona acepta la oferta del intermediario y reporta el pago", async ({ page }) => {
    await ingresar(page, persona.email, "clave1234");
    await page.goto("/notificaciones");
    await expect(page.getByText("¡Nueva oferta para ti!")).toBeVisible();

    await page.goto("/app/ofertas");
    const oferta = page.locator("div.rounded-2xl", { hasText: "Corretaje Andino" }).filter({ hasText: "$4,35" }).first();
    await expect(oferta.getByText("Salud Integral Caribe")).toBeVisible();
    await expect(oferta.getByText(/Ramo 01 Servicios Médicos Asistenciales/)).toBeVisible();
    await oferta.getByRole("button", { name: "Elegir esta oferta" }).click();
    await oferta.getByRole("button", { name: "Confirmar" }).click();

    await expect(page).toHaveURL(/\/app\/polizas\/.+\?nueva=1/);
    await expect(page.getByText("Tu intermediario:")).toBeVisible();
    await page.getByLabel("Banco de origen").selectOption("0134 Banesco");
    await page.getByLabel("Número de referencia").fill(`R${sufijo}`);
    await page.getByRole("button", { name: "Reportar pago" }).click();
    await expect(page.getByText("Registramos tu pago")).toBeVisible();
    await salir(page);
  });

  test("la empresa confirma el pago y la póliza se activa", async ({ page }) => {
    await ingresar(page, "saludcaribe@demo.perfila.app");
    await page.goto("/aseguradora/polizas?tab=pagos");
    const pago = tarjeta(page, `R${sufijo}`);
    await expect(pago.getByText(persona.nombre, { exact: false })).toBeVisible();
    await pago.getByRole("button", { name: "✓ Confirmar pago" }).click();
    await expect(page.locator("div.rounded-2xl", { hasText: `R${sufijo}` })).toHaveCount(0);
    await salir(page);
  });

  test("persona solicita una clave de emergencia", async ({ page }) => {
    await ingresar(page, persona.email, "clave1234");
    await page.getByRole("button", { name: "🚑 Solicitar clave de emergencia" }).click();
    const modal = page.getByRole("dialog");
    await modal.getByLabel("Clínica o centro de salud").fill("Centro Médico Valencia");
    await modal.getByLabel("¿Qué está pasando?").fill("Dolor de pecho y mareos");
    await modal.getByRole("button", { name: "Emitir clave ahora" }).click();
    await expect(modal.getByText("Clave emitida")).toBeVisible();
    await expect(modal.getByText(/^EMG-[A-Z0-9]{4}-[A-Z0-9]{4}$/)).toBeVisible();
    await modal.getByRole("button", { name: "Listo" }).click();
    await salir(page);
  });

  test("la empresa ve la clave y la marca como utilizada", async ({ page }) => {
    await ingresar(page, "saludcaribe@demo.perfila.app");
    await page.goto("/aseguradora/claves");
    const clave = tarjeta(page, "Centro Médico Valencia");
    await expect(clave.getByText("Vigente")).toBeVisible();
    await clave.getByRole("button", { name: "Marcar utilizada" }).click();
    await expect(clave.getByText("Utilizada")).toBeVisible();
    await salir(page);
  });

  test("persona reporta un siniestro y la empresa lo aprueba", async ({ page }) => {
    await ingresar(page, persona.email, "clave1234");
    await page.goto("/app/polizas");
    await page.getByText("Medicina Prepagada").first().click();
    await page.getByLabel("¿Cuándo ocurrió?").fill(hoy());
    await page.getByLabel("Monto que reclamas (USD)").fill("120");
    await page.getByLabel("¿Qué pasó?").fill("Atención de emergencia en Centro Médico Valencia por dolor de pecho.");
    await page.getByRole("button", { name: "Enviar reporte" }).click();
    await expect(page.getByText("Reporte enviado")).toBeVisible();
    await salir(page);

    await ingresar(page, "saludcaribe@demo.perfila.app");
    await page.goto("/aseguradora/siniestros");
    const s = tarjeta(page, "dolor de pecho");
    await s.getByRole("combobox").selectOption("APROBADO");
    await s.getByPlaceholder("Mensaje para el asegurado").fill("Aprobado. Reembolso en 48 h.");
    await s.getByRole("button", { name: "Actualizar" }).click();
    await expect(s.getByText("Aprobado").first()).toBeVisible();
  });

  test("la empresa aprueba el vínculo de un intermediario", async ({ page }) => {
    await ingresar(page, "tepuy@demo.perfila.app");
    await page.goto("/aseguradora/intermediarios");
    const v = tarjeta(page, "Luisa Herrera");
    if (await v.getByRole("button", { name: "Aprobar" }).count()) {
      await v.getByRole("button", { name: "Aprobar" }).click();
    }
    await expect(v.getByText("Aprobado")).toBeVisible();
  });

  test("admin verifica a un intermediario pendiente", async ({ page }) => {
    await ingresar(page, "admin@demo.perfila.app");
    await page.goto("/admin/intermediarios");
    const fila = tarjeta(page, "Carlos Brito");
    if (await fila.getByRole("button", { name: "Verificar" }).count()) {
      await fila.getByRole("button", { name: "Verificar" }).click();
    }
    await expect(fila.getByText("Aprobada")).toBeVisible();
  });

  test("credenciales incorrectas muestran error", async ({ page }) => {
    await ingresar(page, "luis@demo.perfila.app", "incorrecta1", false);
    await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  });
});
