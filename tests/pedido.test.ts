import { describe, expect, it } from "vitest";
import { codigoPedido, costoEnvio, enlaceWhatsApp, mensajePedido, pesos, type Linea } from "../src/lib/pedido";

const linea = (o: Partial<Linea> = {}): Linea => ({ handle: "tacon", titulo: "Tacón stiletto", coleccion: "T × M", marca: "M", sku: "s", talla: "37", color: "Negro", precio: 189900, cantidad: 1, imagen: null, ...o });
const tienda = { envioCosto: 12000, envioGratisDesde: 300000, recogidaLugar: "el local" };

describe("pedido", () => {
  it("formatea pesos colombianos", () => {
    expect(pesos(189900)).toBe("$189.900");
    expect(pesos(1250000)).toBe("$1.250.000");
  });

  it("calcula el envío: costo, gratis desde y recogida", () => {
    expect(costoEnvio([linea()], "envio", tienda)).toBe(12000);
    expect(costoEnvio([linea({ cantidad: 2 })], "envio", tienda)).toBe(0);
    expect(costoEnvio([linea()], "recogida", tienda)).toBe(0);
    expect(costoEnvio([linea()], "envio", { envioCosto: null, envioGratisDesde: null })).toBeNull();
  });

  it("arma el mensaje con código, líneas, totales, entrega y nombre", () => {
    const m = mensajePedido("1019-AB2C", [linea(), linea({ titulo: "Camiseta", talla: "M", color: "Blanco", precio: 69900, cantidad: 2 })], { nombre: "Ana", entrega: { tipo: "envio", direccion: "Popayán, Centro" } }, tienda);
    expect(m).toContain("(#1019-AB2C)");
    expect(m).toContain("• 1 × Tacón stiletto — Negro · Talla 37 — $189.900");
    expect(m).toContain("• 2 × Camiseta — Blanco · Talla M — $139.800");
    expect(m).toContain("Productos: $329.700");
    expect(m).toContain("Envío: gratis");
    expect(m).toContain("Total: $329.700");
    expect(m).toContain("Entrega: envío a Popayán, Centro");
    expect(m).toContain("Nombre: Ana");
  });

  it("deja el envío por confirmar cuando no hay costo", () => {
    const m = mensajePedido("X", [linea()], { nombre: "Ana", entrega: { tipo: "envio", direccion: "Cali" } }, { envioCosto: null, envioGratisDesde: null, recogidaLugar: "" });
    expect(m).toContain("Envío: por confirmar");
    expect(m).toContain("Total: $189.900 + envío");
  });

  it("codifica el enlace de WhatsApp (#, saltos y tildes)", () => {
    const url = enlaceWhatsApp("+57 300 000 0000", "Pedido #1\nTacón");
    expect(url).toBe("https://wa.me/573000000000?text=Pedido%20%231%0ATac%C3%B3n");
  });

  it("genera códigos cortos y legibles", () => {
    const c = codigoPedido(new Date(2026, 9, 19), () => 0);
    expect(c).toBe("1019-AAAA");
    expect(codigoPedido()).toMatch(/^\d{4}-[A-HJ-NP-Z2-9]{4}$/);
  });
});
