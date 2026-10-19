// Muestra de color para los nombres que Sergio escribe en la hoja.
// Si un color no está aquí, el botón muestra el nombre sin muestra.
const COLORES: Record<string, string> = {
  negro: "#16151a",
  blanco: "#f7f6f2",
  hueso: "#ece6da",
  beige: "#d8c7aa",
  nude: "#d9b89c",
  camel: "#b98a57",
  cafe: "#6b4630",
  chocolate: "#4a2e20",
  miel: "#c48a3a",
  gris: "#8d8c88",
  plata: "#c7c9cc",
  plateado: "#c7c9cc",
  dorado: "#c9a54a",
  oro: "#c9a54a",
  rojo: "#b3262e",
  vino: "#7a1c2c",
  rosado: "#e7a6b4",
  rosa: "#e7a6b4",
  fucsia: "#c2185b",
  morado: "#5e3a87",
  lila: "#b49ad4",
  azul: "#1e3fbf",
  "azul oscuro": "#1d2747",
  "azul claro": "#9cc3e6",
  celeste: "#9cc3e6",
  verde: "#2f6b45",
  "verde oliva": "#6b6b3a",
  oliva: "#6b6b3a",
  amarillo: "#e8c547",
  naranja: "#e07a2f",
  mostaza: "#c99a2e",
  terracota: "#b5583a",
  transparente: "transparent",
};

const quitarTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

export function muestraColor(nombre: string): string | null {
  return COLORES[quitarTildes(nombre.trim().toLowerCase())] ?? null;
}
