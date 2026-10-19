import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";

// URL pública de la tienda (dominio propio). En Cloudflare Pages se define SITIO_URL;
// si falta, se usa la URL del despliegue y, en local, localhost.
const site = process.env.SITIO_URL ?? process.env.CF_PAGES_URL ?? "http://localhost:4321";

export default defineConfig({
  site,
  output: "static",
  trailingSlash: "ignore",
  integrations: [preact(), sitemap({ filter: (page) => !page.includes("/qr") })],
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
});
