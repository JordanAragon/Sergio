import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { leerColecciones, leerPrecio, leerProductos, leerTienda, ordenarTallas, rangoTallas } from "../src/datos/catalogo";
import { imagenDirecta } from "../src/lib/imagenes";

const csv = (n: string) => readFileSync(new URL(`../datos/${n}`, import.meta.url), "utf8");
const colecciones = leerColecciones(csv("colaboraciones.csv"));
const productos = leerProductos(csv("productos.csv"), colecciones);

describe("hoja de productos en formato Shopify", () => {
  it("agrupa las filas por Handle con sus variantes", () => {
    const tacon = productos.find((p) => p.handle === "tacon-stiletto")!;
    expect(tacon.titulo).toBe("Tacón stiletto");
    expect(tacon.colores).toEqual(["Negro", "Nude", "Vino"]);
    expect(tacon.tallas).toEqual(["35", "36", "37", "38", "39", "40"]);
    expect(tacon.variantes).toHaveLength(14);
    expect(tacon.coleccion).toBe("calzado");
    expect(tacon.nuevo && tacon.destacado).toBe(true);
  });

  it("marca agotado cuando todas las variantes tienen 0 unidades", () => {
    expect(productos.find((p) => p.handle === "sudadera-capota")!.agotado).toBe(true);
    expect(productos.find((p) => p.handle === "tacon-stiletto")!.agotado).toBe(false);
  });

  it("toma el precio anterior solo si es mayor", () => {
    const s = productos.find((p) => p.handle === "sandalia-tiras")!;
    expect(s.precio).toBe(129900);
    expect(s.precioAntes).toBe(149900);
  });

  it("oculta los productos en borrador o no publicados", () => {
    const texto = `Handle,Title,Published,Status,Option1 Name,Option1 Value,Variant Price
a,A,TRUE,active,Talla,M,1000
b,B,FALSE,active,Talla,M,1000
c,C,TRUE,draft,Talla,M,1000`;
    expect(leerProductos(texto).map((p) => p.handle)).toEqual(["a"]);
  });

  it("une las filas de solo imagen y las imágenes de variante", () => {
    const texto = `Handle,Title,Option1 Name,Option1 Value,Option2 Name,Option2 Value,Variant Price,Image Src,Image Position,Variant Image
x,X,Talla,36,Color,Negro,1000,https://a.co/1.jpg,1,https://a.co/negro.jpg
x,,,37,,Rojo,1000,,,https://a.co/rojo.jpg
x,,,,,,,https://a.co/2.jpg,2,`;
    const [p] = leerProductos(texto);
    expect(p.imagenes).toEqual(["https://a.co/1.jpg", "https://a.co/2.jpg", "https://a.co/negro.jpg", "https://a.co/rojo.jpg"]);
    expect(p.variantes.map((v) => v.color)).toEqual(["Negro", "Rojo"]);
    expect(p.variantes[1].precio).toBe(1000);
  });
});

describe("lectores", () => {
  it("entiende los precios como los escribe la gente", () => {
    expect(leerPrecio("189.900")).toBe(189900);
    expect(leerPrecio("$ 189.900")).toBe(189900);
    expect(leerPrecio("189900.00")).toBe(189900);
    expect(leerPrecio("189,900")).toBe(189900);
    expect(leerPrecio("")).toBeNull();
  });

  it("ordena tallas numéricas y de letra", () => {
    expect(ordenarTallas(["L", "S", "XL", "M"])).toEqual(["S", "M", "L", "XL"]);
    expect(ordenarTallas(["40", "35", "37,5"])).toEqual(["35", "37,5", "40"]);
    expect(rangoTallas(["35", "36", "40"])).toBe("35–40");
    expect(rangoTallas(["S", "M", "XL"])).toBe("S a XL");
  });

  it("convierte enlaces de Google Drive en imágenes", () => {
    expect(imagenDirecta("https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing")).toBe("https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOp");
    expect(imagenDirecta("https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp")).toBe("https://lh3.googleusercontent.com/d/1AbCdEfGhIjKlMnOp");
    expect(imagenDirecta("/productos/a.jpg")).toBe("/productos/a.jpg");
    expect(imagenDirecta("foto.jpg")).toBeNull();
  });

  it("lee la pestaña Tienda", () => {
    const t = leerTienda(csv("tienda.csv"));
    expect(t.whatsapp).toBe("573000000000");
    expect(t.envioCosto).toBeNull();
    expect(t.recogidaLugar).toBe("[lugar]");
  });

  it("lee colaboraciones con su guía y estado", () => {
    expect(colecciones.map((c) => [c.handle, c.estado])).toEqual([["calzado", "visible"], ["camisetas", "visible"], ["belleza", "pronto"]]);
    expect(colecciones[0].guiaTallas[0]).toEqual({ talla: "35", medida: "[cm]" });
  });
});
