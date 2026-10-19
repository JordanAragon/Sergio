// Recorre la tienda en 375, 768 y 1440 px, prueba el pedido y guarda capturas en capturas/.
// Uso: pnpm build && pnpm preview (en otra terminal) && pnpm verificar
// Necesita Playwright instalado (o PLAYWRIGHT_MODULE con la ruta al módulo).
import { mkdirSync } from "node:fs";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const base = process.env.URL ?? "http://localhost:4321";
const anchos = [375, 768, 1440];
const paginas = ["/", "/coleccion/calzado", "/producto/tacon-stiletto", "/buscar?q=negro", "/envios-y-cambios"];
mkdirSync("capturas", { recursive: true });

const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const errores = [];
let fallas = 0;
const comprobar = (ok, texto) => {
  console.log(`${ok ? "✓" : "✗"} ${texto}`);
  if (!ok) fallas++;
};

for (const ancho of anchos) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: ancho < 768 ? 812 : 900 }, deviceScaleFactor: 1 });
  const pagina = await ctx.newPage();
  pagina.on("console", (m) => m.type() === "error" && errores.push(`${ancho}px ${pagina.url()}: ${m.text()}`));
  pagina.on("pageerror", (e) => errores.push(`${ancho}px ${pagina.url()}: ${e.message}`));
  for (const ruta of paginas) {
    await pagina.goto(base + ruta, { waitUntil: "networkidle" });
    const desborde = await pagina.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar(desborde <= 0, `${ancho}px ${ruta} sin scroll horizontal (${desborde})`);
    const nombre = ruta === "/" ? "inicio" : ruta.replace(/[/?=]+/g, "-").replace(/^-|-$/g, "");
    await pagina.screenshot({ path: `capturas/${ancho}-${nombre}.png`, fullPage: true });
  }

  // Pedido de punta a punta en la ficha.
  await pagina.goto(base + "/producto/tacon-stiletto", { waitUntil: "networkidle" });
  const agotada = await pagina.locator('button.talla[aria-label="Talla 35, agotada"]').isDisabled();
  comprobar(agotada, `${ancho}px la talla agotada está tachada y deshabilitada`);
  await pagina.locator('button.talla[aria-label="Talla 37"]').click();
  await pagina.getByRole("button", { name: /Agregar al pedido/ }).click();
  const cajon = pagina.locator("dialog.cajon[open]");
  await cajon.waitFor();
  comprobar(await cajon.getByText("Tacón stiletto").isVisible(), `${ancho}px el producto llega al cajón`);
  await cajon.getByRole("link", { name: /Enviar pedido por WhatsApp/ }).click({ noWaitAfter: true }).catch(() => {});
  comprobar(await cajon.getByText("Escribe tu nombre.").isVisible(), `${ancho}px pide el nombre antes de enviar`);
  await cajon.getByLabel("Tu nombre").fill("Ana Prueba");
  await cajon.getByLabel("Ciudad y dirección").fill("Popayán, barrio Centro, calle 5 # 6-10");
  await cajon.getByRole("button", { name: /Así llega el mensaje/ }).click();
  const mensaje = await cajon.locator(".mensaje pre").innerText();
  comprobar(/1 × Tacón stiletto — Negro · Talla 37/.test(mensaje) && /Nombre: Ana Prueba/.test(mensaje), `${ancho}px el mensaje lleva producto, talla, color y nombre`);
  const href = await cajon.getByRole("link", { name: /Enviar pedido por WhatsApp/ }).getAttribute("href");
  comprobar(href?.startsWith("https://wa.me/") && href.includes("%0A") && href.includes("%23"), `${ancho}px el enlace de WhatsApp va codificado`);
  await pagina.screenshot({ path: `capturas/${ancho}-pedido.png` });
  await ctx.close();
}

await navegador.close();
comprobar(errores.length === 0, `sin errores de consola${errores.length ? ":\n  " + errores.join("\n  ") : ""}`);
process.exit(fallas ? 1 : 0);
