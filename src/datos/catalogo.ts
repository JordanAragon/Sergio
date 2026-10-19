// Lectura del catálogo. Funciones puras: corren igual en el build (Node) y en el navegador.
// La hoja «Productos» usa las columnas de la importación de productos de Shopify,
// una fila por variante (talla × color). Así migrar a Shopify es exportar el CSV e importarlo.
import Papa from "papaparse";
import { imagenDirecta } from "../lib/imagenes";

export type Variante = {
  sku: string;
  talla: string;
  color: string;
  precio: number;
  precioAntes: number | null;
  /** null = sin control de unidades (siempre disponible). */
  unidades: number | null;
  imagen: string | null;
};

export type Producto = {
  handle: string;
  titulo: string;
  descripcion: string;
  marca: string;
  tipo: string;
  etiquetas: string[];
  coleccion: string | null;
  nuevo: boolean;
  destacado: boolean;
  imagenes: string[];
  variantes: Variante[];
  colores: string[];
  tallas: string[];
  precio: number;
  precioAntes: number | null;
  agotado: boolean;
  /** Unidades disponibles sumando todas las variantes; null si no se controlan. */
  unidades: number | null;
};

export type Coleccion = {
  handle: string;
  nombre: string;
  subtitulo: string;
  marca: string;
  color: string;
  logo: string | null;
  foto: string | null;
  descripcion: string;
  guiaTallas: { talla: string; medida: string }[];
  orden: number;
  estado: "visible" | "pronto" | "oculta";
};

export type Tienda = {
  nombre: string;
  lema: string;
  descripcion: string;
  whatsapp: string;
  envioCiudades: string;
  envioCosto: number | null;
  envioGratisDesde: number | null;
  envioTiempo: string;
  recogidaLugar: string;
  vendedorNombre: string;
  vendedorDocumento: string;
  vendedorCiudad: string;
  correo: string;
  instagram: string;
  tiktok: string;
  horario: string;
  pago: string;
};

type Fila = Record<string, string>;

export function leerCsv(texto: string): Fila[] {
  const r = Papa.parse<Fila>(texto.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
    transform: (v) => (typeof v === "string" ? v.trim() : v),
  });
  return r.data;
}

/** Convierte «189.900», «$189900», «189900.00» o «189,900» en 189900. */
export function leerPrecio(valor: string | undefined): number | null {
  if (!valor) return null;
  const limpio = valor.replace(/[^\d.,]/g, "");
  if (!limpio) return null;
  const decimal = limpio.match(/^(.*\d)[.,](\d{1,2})$/);
  const entero = decimal ? decimal[1] : limpio;
  const n = Number(entero.replace(/[.,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function leerEntero(valor: string | undefined): number | null {
  if (valor === undefined || valor === "") return null;
  const n = Number(valor.replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

const ORDEN_TALLAS = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];

export function ordenarTallas(tallas: string[]): string[] {
  return [...tallas].sort((a, b) => {
    const na = Number(a.replace(",", "."));
    const nb = Number(b.replace(",", "."));
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    const ia = ORDEN_TALLAS.indexOf(a.toUpperCase());
    const ib = ORDEN_TALLAS.indexOf(b.toUpperCase());
    if (ia !== -1 && ib !== -1) return ia - ib;
    return a.localeCompare(b, "es");
  });
}

function sinDuplicados<T>(lista: T[]): T[] {
  return [...new Set(lista)];
}

function esVerdadero(v: string | undefined): boolean {
  return /^(true|verdadero|si|sí|1|x)$/i.test(v ?? "");
}

export function leerColecciones(texto: string): Coleccion[] {
  return leerCsv(texto)
    .filter((f) => f["Handle"])
    .map((f) => {
      const estado = (f["Estado"] ?? "").toLowerCase();
      return {
        handle: f["Handle"].toLowerCase(),
        nombre: f["Nombre"] || f["Handle"],
        subtitulo: f["Subtitulo"] ?? "",
        marca: f["Marca"] ?? "",
        color: /^#[0-9a-f]{3,8}$/i.test(f["Color"] ?? "") ? f["Color"] : "#111110",
        logo: imagenDirecta(f["Logo"]),
        foto: imagenDirecta(f["Foto"]),
        descripcion: f["Descripcion"] ?? "",
        guiaTallas: (f["Guia de tallas"] ?? "")
          .split(/[;\n]/)
          .map((par) => par.split("="))
          .filter((p) => p.length === 2 && p[0].trim())
          .map(([talla, medida]) => ({ talla: talla.trim(), medida: medida.trim() })),
        orden: Number(f["Orden"]) || 99,
        estado: estado.startsWith("pronto") ? ("pronto" as const) : estado.startsWith("oculta") || estado === "no" ? ("oculta" as const) : ("visible" as const),
      };
    })
    .sort((a, b) => a.orden - b.orden);
}

export function leerProductos(texto: string, colecciones: Coleccion[] = []): Producto[] {
  const porHandle = new Map<string, Fila[]>();
  for (const f of leerCsv(texto)) {
    const h = (f["Handle"] ?? "").toLowerCase();
    if (!h) continue;
    if (!porHandle.has(h)) porHandle.set(h, []);
    porHandle.get(h)!.push(f);
  }

  const productos: Producto[] = [];
  for (const [handle, filas] of porHandle) {
    const base = filas.find((f) => f["Title"]) ?? filas[0];
    const estado = (base["Status"] ?? "active").toLowerCase();
    const publicado = base["Published"] === undefined || base["Published"] === "" || esVerdadero(base["Published"]);
    if (!publicado || estado === "draft" || estado === "archived" || estado === "borrador") continue;

    const nombres = [base["Option1 Name"], base["Option2 Name"], base["Option3 Name"]].map((n) => (n ?? "").toLowerCase());
    const indice = (re: RegExp) => nombres.findIndex((n) => re.test(n));
    const iTalla = indice(/talla|size/);
    const iColor = indice(/color|colour/);
    const valor = (f: Fila, i: number) => (i === -1 ? "" : (f[`Option${i + 1} Value`] ?? ""));

    let precioPrevio = leerPrecio(base["Variant Price"]) ?? 0;
    const variantes: Variante[] = [];
    const imagenes: { src: string; pos: number }[] = [];
    for (const f of filas) {
      const img = imagenDirecta(f["Image Src"]);
      if (img) imagenes.push({ src: img, pos: Number(f["Image Position"]) || imagenes.length + 1 });
      const tieneVariante = f["Option1 Value"] || f["Variant Price"] || f["Variant SKU"];
      if (!tieneVariante) continue;
      const precio = leerPrecio(f["Variant Price"]) ?? precioPrevio;
      precioPrevio = precio;
      const antes = leerPrecio(f["Variant Compare At Price"]);
      variantes.push({
        sku: f["Variant SKU"] ?? "",
        talla: valor(f, iTalla),
        color: valor(f, iColor),
        precio,
        precioAntes: antes && antes > precio ? antes : null,
        unidades: leerEntero(f["Variant Inventory Qty"]),
        imagen: imagenDirecta(f["Variant Image"]),
      });
    }
    if (variantes.length === 0) continue;

    const etiquetas = (base["Tags"] ?? "")
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const marca = base["Vendor"] ?? "";
    const coleccion =
      etiquetas.find((t) => colecciones.some((c) => c.handle === t)) ??
      colecciones.find((c) => c.marca && c.marca === marca)?.handle ??
      null;

    const disponibles = variantes.filter((v) => v.unidades === null || v.unidades > 0);
    const conControl = variantes.every((v) => v.unidades !== null);
    const referencia = disponibles.length ? disponibles : variantes;
    const masBarata = referencia.reduce((a, b) => (b.precio < a.precio ? b : a));
    const imgsVariante = variantes.map((v) => v.imagen).filter((x): x is string => !!x);

    productos.push({
      handle,
      titulo: base["Title"] || handle,
      descripcion: (base["Body (HTML)"] ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      marca,
      tipo: base["Type"] ?? "",
      etiquetas,
      coleccion,
      nuevo: etiquetas.includes("nuevo"),
      destacado: etiquetas.includes("destacado"),
      imagenes: sinDuplicados([...imagenes.sort((a, b) => a.pos - b.pos).map((i) => i.src), ...imgsVariante]),
      variantes,
      colores: sinDuplicados(variantes.map((v) => v.color).filter(Boolean)),
      tallas: ordenarTallas(sinDuplicados(variantes.map((v) => v.talla).filter(Boolean))),
      precio: masBarata.precio,
      precioAntes: masBarata.precioAntes,
      agotado: disponibles.length === 0,
      unidades: conControl ? disponibles.reduce((s, v) => s + (v.unidades ?? 0), 0) : null,
    });
  }
  return productos;
}

export function leerTienda(texto: string): Tienda {
  const kv = new Map<string, string>();
  for (const f of leerCsv(texto)) {
    const clave = (f["Clave"] ?? "").toLowerCase();
    if (clave) kv.set(clave, f["Valor"] ?? "");
  }
  const t = (k: string, d = "") => kv.get(k) || d;
  return {
    nombre: t("nombre", "[Nombre]"),
    lema: t("lema"),
    descripcion: t("descripcion"),
    whatsapp: t("whatsapp").replace(/\D/g, ""),
    envioCiudades: t("envio_ciudades"),
    envioCosto: leerPrecio(t("envio_costo")),
    envioGratisDesde: leerPrecio(t("envio_gratis_desde")),
    envioTiempo: t("envio_tiempo"),
    recogidaLugar: t("recogida_lugar"),
    vendedorNombre: t("vendedor_nombre"),
    vendedorDocumento: t("vendedor_documento"),
    vendedorCiudad: t("vendedor_ciudad"),
    correo: t("correo"),
    instagram: t("instagram").replace(/^@/, ""),
    tiktok: t("tiktok").replace(/^@/, ""),
    horario: t("horario"),
    pago: t("pago"),
  };
}

export { disponible } from "../lib/variantes";

/** Texto corto de tallas: «35–40» o «S a XL». */
export function rangoTallas(tallas: string[]): string {
  if (tallas.length === 0) return "";
  if (tallas.length === 1) return tallas[0];
  const numericas = tallas.every((t) => Number.isFinite(Number(t.replace(",", "."))));
  return numericas ? `${tallas[0]}–${tallas[tallas.length - 1]}` : `${tallas[0]} a ${tallas[tallas.length - 1]}`;
}
