import type { APIRoute } from "astro";
import { catalogo } from "../datos/fuente";
import { empaquetarIco, nodoIcono, png } from "../lib/og";

export const GET: APIRoute = async () => {
  const { tienda } = await catalogo();
  const pngs = await Promise.all([16, 32, 48].map(async (tam) => ({ tam, datos: await png(nodoIcono(tienda.nombre, tam), tam, tam) })));
  return new Response(new Uint8Array(empaquetarIco(pngs)), { headers: { "Content-Type": "image/x-icon" } });
};
