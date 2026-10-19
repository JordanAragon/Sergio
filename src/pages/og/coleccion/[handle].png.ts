import type { APIRoute, GetStaticPaths } from "astro";
import { catalogo } from "../../../datos/fuente";
import { PAPEL, fotoDataUri, png, respuestaPng, tarjeta } from "../../../lib/og";

export const getStaticPaths: GetStaticPaths = async () => {
  const cat = await catalogo();
  return cat.colecciones.filter((c) => c.estado === "visible").map((c) => ({ params: { handle: c.handle } }));
};

export const GET: APIRoute = async ({ params, site }) => {
  const cat = await catalogo();
  const c = cat.colecciones.find((x) => x.handle === params.handle)!;
  const foto = await fotoDataUri(c.foto, site ?? new URL("http://localhost"));
  const nodo = tarjeta({ fondo: c.color, texto: PAPEL, sobre: `${cat.tienda.nombre} × ${c.marca}`, titulo: c.nombre, pie: c.subtitulo || "Pedidos por WhatsApp", foto });
  return respuestaPng(await png(nodo));
};
