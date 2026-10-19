import type { APIRoute, GetStaticPaths } from "astro";
import { catalogo } from "../../../datos/fuente";
import { PAPEL, TINTA, fotoDataUri, png, respuestaPng, tarjeta } from "../../../lib/og";
import { pesos } from "../../../lib/pedido";

export const getStaticPaths: GetStaticPaths = async () => {
  const cat = await catalogo();
  return cat.productos.map((p) => ({ params: { handle: p.handle } }));
};

export const GET: APIRoute = async ({ params, site }) => {
  const cat = await catalogo();
  const p = cat.productos.find((x) => x.handle === params.handle)!;
  const c = cat.colecciones.find((x) => x.handle === p.coleccion);
  const foto = await fotoDataUri(p.imagenes[0], site ?? new URL("http://localhost"));
  const precioVaria = new Set(p.variantes.map((v) => v.precio)).size > 1;
  const nodo = tarjeta({
    fondo: c?.color ?? PAPEL,
    texto: c ? PAPEL : TINTA,
    sobre: c ? `${cat.tienda.nombre} × ${c.marca}` : cat.tienda.nombre,
    titulo: p.titulo,
    pie: p.agotado ? "Agotado" : `${precioVaria ? "Desde " : ""}${pesos(p.precio)} · Pide por WhatsApp`,
    foto,
  });
  return respuestaPng(await png(nodo));
};
