// El pedido: cálculo de totales y el mensaje que llega al WhatsApp de la tienda.
import type { Tienda } from "../datos/catalogo";

export type Linea = {
  handle: string;
  titulo: string;
  coleccion: string;
  marca: string;
  sku: string;
  talla: string;
  color: string;
  precio: number;
  cantidad: number;
  imagen: string | null;
};

export type Entrega = { tipo: "envio"; direccion: string } | { tipo: "recogida" };

export type Datos = { nombre: string; entrega: Entrega; nota?: string };

export const pesos = (n: number) => "$" + Math.round(n).toLocaleString("es-CO").replace(/,/g, ".");

export function unidades(lineas: Linea[]): number {
  return lineas.reduce((s, l) => s + l.cantidad, 0);
}

export function subtotal(lineas: Linea[]): number {
  return lineas.reduce((s, l) => s + l.precio * l.cantidad, 0);
}

/** null = el costo se confirma por WhatsApp. */
export function costoEnvio(lineas: Linea[], entrega: Entrega["tipo"], tienda: Pick<Tienda, "envioCosto" | "envioGratisDesde">): number | null {
  if (entrega === "recogida") return 0;
  if (tienda.envioGratisDesde !== null && subtotal(lineas) >= tienda.envioGratisDesde) return 0;
  return tienda.envioCosto;
}

/** Código corto y legible: mes-día y cuatro caracteres sin letras que se confunden. */
export function codigoPedido(fecha = new Date(), azar: () => number = Math.random): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const md = String(fecha.getMonth() + 1).padStart(2, "0") + String(fecha.getDate()).padStart(2, "0");
  let s = "";
  for (let i = 0; i < 4; i++) s += letras[Math.floor(azar() * letras.length)];
  return `${md}-${s}`;
}

export function detalleLinea(l: Pick<Linea, "color" | "talla">): string {
  return [l.color, l.talla && `Talla ${l.talla}`].filter(Boolean).join(" · ");
}

export function mensajePedido(codigo: string, lineas: Linea[], datos: Datos, tienda: Pick<Tienda, "envioCosto" | "envioGratisDesde" | "recogidaLugar">): string {
  const envio = costoEnvio(lineas, datos.entrega.tipo, tienda);
  const sub = subtotal(lineas);
  const partes = [
    `Hola, quiero hacer este pedido (#${codigo}):`,
    ...lineas.map((l) => `• ${l.cantidad} × ${l.titulo} — ${detalleLinea(l)} — ${pesos(l.precio * l.cantidad)}`),
    "",
    `Productos: ${pesos(sub)}`,
    `Envío: ${envio === null ? "por confirmar" : envio === 0 ? (datos.entrega.tipo === "recogida" ? "recojo en tienda" : "gratis") : pesos(envio)}`,
    `Total: ${pesos(sub + (envio ?? 0))}${envio === null ? " + envío" : ""}`,
    "",
    datos.entrega.tipo === "envio" ? `Entrega: envío a ${datos.entrega.direccion}` : `Entrega: recojo en ${tienda.recogidaLugar}`,
    `Nombre: ${datos.nombre}`,
  ];
  if (datos.nota?.trim()) partes.push(`Nota: ${datos.nota.trim()}`);
  return partes.join("\n");
}

export function enlaceWhatsApp(numero: string, texto: string): string {
  return `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}
