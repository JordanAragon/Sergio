// Datos del build. Si las pestañas de la hoja están configuradas, se leen de ahí;
// si no, se usan los datos de ejemplo de datos/. Si la hoja está configurada y falla,
// el build se detiene: así Cloudflare deja publicada la última versión buena
// en lugar de publicar una tienda vacía o con productos de ejemplo.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { leerColecciones, leerProductos, leerTienda, type Coleccion, type Producto, type Tienda } from "./catalogo";

async function leer(url: string | undefined, local: string): Promise<{ texto: string; deHoja: boolean }> {
  if (url) {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) throw new Error(`No se pudo leer la hoja (${r.status}): ${url}`);
    const texto = await r.text();
    if (/^\s*</.test(texto)) throw new Error(`La hoja no está publicada como CSV: ${url}`);
    return { texto, deHoja: true };
  }
  return { texto: await readFile(resolve(process.cwd(), "datos", local), "utf8"), deHoja: false };
}

export type Catalogo = {
  tienda: Tienda;
  colecciones: Coleccion[];
  productos: Producto[];
  /** true cuando la tienda muestra los datos de ejemplo del repo. */
  ejemplo: boolean;
};

let cache: Promise<Catalogo> | undefined;

export function catalogo(): Promise<Catalogo> {
  cache ??= (async () => {
    const env = import.meta.env;
    const [p, c, t] = await Promise.all([
      leer(env.PUBLIC_CSV_PRODUCTOS, "productos.csv"),
      leer(env.PUBLIC_CSV_COLABORACIONES, "colaboraciones.csv"),
      leer(env.PUBLIC_CSV_TIENDA, "tienda.csv"),
    ]);
    const colecciones = leerColecciones(c.texto).filter((x) => x.estado !== "oculta");
    return {
      tienda: leerTienda(t.texto),
      colecciones,
      productos: leerProductos(p.texto, colecciones),
      ejemplo: !p.deHoja,
    };
  })();
  return cache;
}

export function productosDe(cat: Catalogo, coleccion: string): Producto[] {
  return cat.productos.filter((p) => p.coleccion === coleccion);
}

/** Primero los disponibles; dentro de cada grupo, destacados y nuevos primero. */
export function ordenVitrina(lista: Producto[]): Producto[] {
  const peso = (p: Producto) => (p.agotado ? 100 : 0) - (p.destacado ? 2 : 0) - (p.nuevo ? 1 : 0);
  return [...lista].sort((a, b) => peso(a) - peso(b));
}
