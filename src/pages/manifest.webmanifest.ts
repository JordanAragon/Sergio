import type { APIRoute } from "astro";
import { catalogo } from "../datos/fuente";

export const GET: APIRoute = async () => {
  const { tienda } = await catalogo();
  const manifiesto = {
    name: tienda.nombre,
    short_name: tienda.nombre,
    description: tienda.descripcion || tienda.lema,
    lang: "es-CO",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f2ef",
    theme_color: "#f3f2ef",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
  return new Response(JSON.stringify(manifiesto, null, 2), { headers: { "Content-Type": "application/manifest+json" } });
};
