// Estado del pedido compartido entre las islas (botón del encabezado, ficha y cajón).
// Se guarda en el navegador del cliente para que no pierda el pedido al cambiar de página.
import { atom, computed } from "nanostores";
import type { Linea } from "../lib/pedido";
import type { Producto } from "../datos/catalogo";

const CLAVE = "pedido:v1";

function cargar(): Linea[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(CLAVE) : null;
    const lista = raw ? (JSON.parse(raw) as Linea[]) : [];
    return Array.isArray(lista) ? lista.filter((l) => l && l.handle && l.cantidad > 0) : [];
  } catch {
    return [];
  }
}

export const $lineas = atom<Linea[]>(typeof window === "undefined" ? [] : cargar());
export const $cajonAbierto = atom(false);
export const $unidades = computed($lineas, (l) => l.reduce((s, x) => s + x.cantidad, 0));

$lineas.listen((lineas) => {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lineas));
  } catch {
    /* modo privado o almacenamiento bloqueado: el pedido vive mientras la página esté abierta */
  }
});

const igual = (a: Pick<Linea, "handle" | "talla" | "color">, b: Pick<Linea, "handle" | "talla" | "color">) =>
  a.handle === b.handle && a.talla === b.talla && a.color === b.color;

export function agregar(linea: Linea) {
  const lista = $lineas.get();
  const i = lista.findIndex((l) => igual(l, linea));
  if (i === -1) $lineas.set([...lista, linea]);
  else $lineas.set(lista.map((l, j) => (j === i ? { ...l, cantidad: l.cantidad + linea.cantidad } : l)));
}

export function cambiarCantidad(linea: Linea, cantidad: number) {
  if (cantidad <= 0) return quitar(linea);
  $lineas.set($lineas.get().map((l) => (igual(l, linea) ? { ...l, cantidad } : l)));
}

export function quitar(linea: Linea) {
  $lineas.set($lineas.get().filter((l) => !igual(l, linea)));
}

export function vaciar() {
  $lineas.set([]);
}

// Catálogo en vivo: la hoja publicada se vuelve a leer en el navegador para que un cambio
// de precio o de unidades se vea sin esperar a que el sitio se reconstruya.
export const $vivo = atom<Map<string, Producto> | null>(null);
let cargando = false;

export function cargarVivo() {
  const url = import.meta.env.PUBLIC_CSV_PRODUCTOS;
  if (!url || cargando || $vivo.get()) return;
  cargando = true;
  fetch(url)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
    .then(async (texto) => {
      if (/^\s*</.test(texto)) return;
      const { leerProductos } = await import("../datos/catalogo");
      $vivo.set(new Map(leerProductos(texto).map((p) => [p.handle, p])));
    })
    .catch(() => {
      /* sin conexión con la hoja: se queda lo del último build */
    })
    .finally(() => {
      cargando = false;
    });
}
