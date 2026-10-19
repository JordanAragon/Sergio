// Imágenes Open Graph (1200×630, PNG) e íconos, generados en el build con satori + resvg.
// Solo corre en Node (endpoints estáticos de Astro).
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type Nodo = { type: string; props: Record<string, unknown> & { children?: unknown } };
export const h = (type: string, style: Record<string, unknown>, ...children: unknown[]): Nodo => ({
  type,
  props: { style: { display: "flex", ...style }, children: children.length === 1 ? children[0] : children },
});

let fuentes: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]> | undefined;
function cargarFuentes() {
  const dir = resolve(process.cwd(), "node_modules/@fontsource/archivo/files");
  fuentes ??= Promise.all([
    readFile(resolve(dir, "archivo-latin-500-normal.woff")).then((data) => ({ name: "Archivo", data, weight: 500 as const, style: "normal" as const })),
    readFile(resolve(dir, "archivo-latin-800-normal.woff")).then((data) => ({ name: "Archivo", data, weight: 800 as const, style: "normal" as const })),
  ]);
  return fuentes;
}

export async function svg(nodo: Nodo, ancho: number, alto: number): Promise<string> {
  return satori(nodo as never, { width: ancho, height: alto, fonts: await cargarFuentes() });
}

export async function png(nodo: Nodo, ancho = 1200, alto = 630): Promise<Buffer> {
  const s = await svg(nodo, ancho, alto);
  return new Resvg(s, { fitTo: { mode: "width", value: ancho } }).render().asPng();
}

export function respuestaPng(buf: Buffer): Response {
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "image/png" } });
}

/** Trae una foto y la deja como data URI para satori (solo JPG o PNG). */
export async function fotoDataUri(url: string | null | undefined, site: URL): Promise<string | null> {
  if (!url) return null;
  try {
    const abs = new URL(url.startsWith("https://lh3.googleusercontent.com/d/") ? `${url}=w1200` : url, site);
    if (abs.hostname === "localhost") return null;
    const r = await fetch(abs);
    const tipo = r.headers.get("content-type") ?? "";
    if (!r.ok || !/image\/(jpeg|png)/.test(tipo)) return null;
    return `data:${tipo};base64,${Buffer.from(await r.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

export const PAPEL = "#F3F2EF";
export const TINTA = "#111110";

/** Letra para el ícono: la primera letra o número del nombre de la tienda. */
export function inicial(nombre: string): string {
  return (nombre.match(/[\p{L}\p{N}]/u)?.[0] ?? "T").toUpperCase();
}

/** Tarjeta OG común: sobretítulo, título grande, pie, color de fondo y foto opcional. */
export function tarjeta({ fondo, texto, sobre, titulo, pie, foto }: { fondo: string; texto: string; sobre: string; titulo: string; pie: string; foto?: string | null }): Nodo {
  const columna = h(
    "div",
    { flexDirection: "column", justifyContent: "space-between", padding: "64px 64px 56px", flex: 1, height: "100%" },
    h("div", { fontSize: 26, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase" }, sobre),
    h("div", { fontSize: titulo.length > 28 ? 72 : 92, fontWeight: 800, lineHeight: 0.98, letterSpacing: -2 }, titulo),
    h("div", { fontSize: 28, fontWeight: 500, opacity: 0.85 }, pie),
  );
  const hijos: unknown[] = [columna];
  if (foto) hijos.push({ type: "img", props: { src: foto, width: 470, height: 630, style: { width: 470, height: 630, objectFit: "cover" } } });
  return h("div", { width: "100%", height: "100%", background: fondo, color: texto, fontFamily: "Archivo" }, ...hijos);
}

/** Ícono cuadrado: la inicial de la tienda en papel sobre tinta. */
export function nodoIcono(nombre: string, tam: number, redondo = true): Nodo {
  return h(
    "div",
    { width: tam, height: tam, background: TINTA, color: PAPEL, borderRadius: redondo ? tam * 0.22 : 0, alignItems: "center", justifyContent: "center", fontFamily: "Archivo", fontWeight: 800, fontSize: tam * 0.62, lineHeight: 1 },
    inicial(nombre),
  );
}

/** ICO con PNG dentro (16, 32 y 48 px). */
export function empaquetarIco(pngs: { tam: number; datos: Buffer }[]): Buffer {
  const cabeza = Buffer.alloc(6 + 16 * pngs.length);
  cabeza.writeUInt16LE(0, 0);
  cabeza.writeUInt16LE(1, 2);
  cabeza.writeUInt16LE(pngs.length, 4);
  let desplazamiento = cabeza.length;
  pngs.forEach(({ tam, datos }, i) => {
    const b = 6 + 16 * i;
    cabeza.writeUInt8(tam >= 256 ? 0 : tam, b);
    cabeza.writeUInt8(tam >= 256 ? 0 : tam, b + 1);
    cabeza.writeUInt16LE(1, b + 4);
    cabeza.writeUInt16LE(32, b + 6);
    cabeza.writeUInt32LE(datos.length, b + 8);
    cabeza.writeUInt32LE(desplazamiento, b + 12);
    desplazamiento += datos.length;
  });
  return Buffer.concat([cabeza, ...pngs.map((p) => p.datos)]);
}
