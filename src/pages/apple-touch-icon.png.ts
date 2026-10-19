import type { APIRoute } from "astro";
import { catalogo } from "../datos/fuente";
import { nodoIcono, png, respuestaPng } from "../lib/og";

export const GET: APIRoute = async () => {
  const { tienda } = await catalogo();
  return respuestaPng(await png(nodoIcono(tienda.nombre, 180, false), 180, 180));
};
