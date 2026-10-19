// Trazos de los íconos (24×24, línea de 1.6). Los usan las páginas y las islas.
export const ICONOS = {
  menu: ["M4 7h16", "M4 12h16", "M4 17h10"],
  bolsa: ["M5 8h14l-1.2 12H6.2L5 8Z", "M9 8V6a3 3 0 0 1 6 0v2"],
  cerrar: ["M6 6l12 12", "M18 6L6 18"],
  volver: ["M15 5l-7 7 7 7"],
  buscar: ["M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z", "M20 20l-4.8-4.8"],
  whatsapp: ["M4 20l1.3-3.9A8 8 0 1 1 8 19z", "M9 9.5c.3 2 1.8 3.8 4 4.6l1.2-1.1 1.8.8-.3 1.6c-3.6.4-7.6-3.2-7.4-6.6l1.6-.4.8 1.8z"],
  mas: ["M12 5v14", "M5 12h14"],
  menos: ["M5 12h14"],
  copiar: ["M9 9h10v10H9z", "M5 15V5h10"],
  flecha: ["M5 12h14", "M13 6l6 6-6 6"],
  filtro: ["M4 7h10", "M18 7h2", "M4 17h4", "M12 17h8", "M16 5v4", "M10 15v4"],
  basura: ["M5 7h14", "M10 7V5h4v2", "M7 7l1 12h8l1-12"],
  ok: ["M5 12.5l4.5 4.5L19 7"],
} as const;

export type NombreIcono = keyof typeof ICONOS;
