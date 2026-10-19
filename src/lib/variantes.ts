// Utilidades de variantes sin dependencias, para las islas (no cargan el lector de CSV).
import type { Variante } from "../datos/catalogo";

/** Variante disponible: existe y no tiene las unidades en 0. */
export function disponible(v: Variante | undefined): boolean {
  return !!v && (v.unidades === null || v.unidades > 0);
}
