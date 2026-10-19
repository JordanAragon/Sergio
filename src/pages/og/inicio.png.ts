import type { APIRoute } from "astro";
import { catalogo } from "../../datos/fuente";
import { PAPEL, TINTA, h, png, respuestaPng } from "../../lib/og";

export const GET: APIRoute = async () => {
  const { tienda, colecciones } = await catalogo();
  const franjas = colecciones.filter((c) => c.estado === "visible");
  const nodo = h(
    "div",
    { width: "100%", height: "100%", background: PAPEL, color: TINTA, fontFamily: "Archivo", flexDirection: "column" },
    h(
      "div",
      { flexDirection: "column", justifyContent: "space-between", padding: "64px 64px 48px", flex: 1 },
      h("div", { fontSize: 30, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase" }, tienda.nombre),
      h("div", { fontSize: (tienda.lema || "").length > 48 ? 66 : 80, fontWeight: 800, lineHeight: 1, letterSpacing: -2, maxWidth: 1000 }, tienda.lema || "Catálogo"),
      h("div", { fontSize: 26, fontWeight: 500, color: "#5B5A56" }, "Pedidos por WhatsApp"),
    ),
    h(
      "div",
      { height: 92 },
      ...(franjas.length
        ? franjas.map((c) => h("div", { flex: 1, background: c.color, color: PAPEL, alignItems: "center", padding: "0 28px", fontSize: 24, fontWeight: 800 }, c.nombre))
        : [h("div", { flex: 1, background: TINTA }, "")]),
    ),
  );
  return respuestaPng(await png(nodo));
};
