// Prepara el CSV de productos para importarlo en Shopify (Productos › Importar).
// La hoja ya usa las columnas de Shopify; este script solo convierte los enlaces de
// Google Drive en URL de imagen y completa las columnas de inventario que Shopify espera.
// Uso: node scripts/exportar-shopify.mjs [productos.csv o URL]  → shopify-productos.csv
import { readFile, writeFile } from "node:fs/promises";
import Papa from "papaparse";

const origen = process.argv[2] ?? process.env.PUBLIC_CSV_PRODUCTOS ?? "datos/productos.csv";
const texto = /^https?:\/\//.test(origen) ? await (await fetch(origen)).text() : await readFile(origen, "utf8");
const { data, meta } = Papa.parse(texto.replace(/^﻿/, ""), { header: true, skipEmptyLines: "greedy" });

const drive = (u) => {
  const m = String(u ?? "").match(/drive\.google\.com\/(?:file\/d\/|(?:open|uc)\?(?:.*&)?id=)([\w-]{10,})/);
  return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w2048` : u;
};

const extra = ["Variant Inventory Tracker", "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Requires Shipping"];
const columnas = [...meta.fields, ...extra.filter((c) => !meta.fields.includes(c))];
const filas = data.map((f) => {
  const fila = { ...f, "Image Src": drive(f["Image Src"]), "Variant Image": drive(f["Variant Image"]) };
  if (f["Option1 Value"] || f["Variant Price"]) {
    fila["Variant Inventory Tracker"] = f["Variant Inventory Qty"] === "" ? "" : "shopify";
    fila["Variant Inventory Policy"] = "deny";
    fila["Variant Fulfillment Service"] = "manual";
    fila["Variant Requires Shipping"] = "TRUE";
  }
  return fila;
});

await writeFile("shopify-productos.csv", Papa.unparse({ fields: columnas, data: filas.map((f) => columnas.map((c) => f[c] ?? "")) }) + "\n");
console.log(`shopify-productos.csv: ${new Set(filas.map((f) => f.Handle)).size} productos, ${filas.length} filas.`);
