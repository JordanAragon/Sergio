import type { APIRoute } from "astro";
import { catalogo } from "../datos/fuente";
import { nodoIcono, svg } from "../lib/og";

export const GET: APIRoute = async () => {
  const { tienda } = await catalogo();
  return new Response(await svg(nodoIcono(tienda.nombre, 64), 64, 64), { headers: { "Content-Type": "image/svg+xml" } });
};
