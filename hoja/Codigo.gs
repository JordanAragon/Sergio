/**
 * Hoja de la tienda — Apps Script.
 *
 * Va dentro de la hoja de Google de la tienda (Extensiones › Apps Script). Hace tres cosas:
 *   1. configurar(): crea las pestañas Productos, Colaboraciones, Tienda, Pedidos y Resumen.
 *   2. doPost(): recibe cada pedido que el cliente envía desde la tienda y lo anota en Pedidos.
 *   3. Reconstrucción: cuando se edita el catálogo, avisa a Cloudflare Pages para que publique
 *      la tienda otra vez (opcional; necesita la propiedad DEPLOY_HOOK_URL).
 *
 * Guía de instalación: hoja/README.md del repo.
 */

var PESTANAS = {
  productos: "Productos",
  colaboraciones: "Colaboraciones",
  tienda: "Tienda",
  pedidos: "Pedidos",
  resumen: "Resumen",
};

// Columnas de la importación de productos de Shopify (las que usa la tienda).
var COLUMNAS_PRODUCTOS = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published",
  "Option1 Name", "Option1 Value", "Option2 Name", "Option2 Value",
  "Variant SKU", "Variant Inventory Qty", "Variant Price", "Variant Compare At Price",
  "Image Src", "Image Position", "Variant Image", "Status",
];

var COLUMNAS_COLABORACIONES = ["Handle", "Nombre", "Subtitulo", "Marca", "Color", "Logo", "Foto", "Descripcion", "Guia de tallas", "Orden", "Estado"];

var CLAVES_TIENDA = [
  ["nombre", "Nombre de la tienda. Sale en el encabezado, en WhatsApp y en la vista previa de los enlaces."],
  ["lema", "Frase grande del inicio."],
  ["descripcion", "Texto que ve Google y la vista previa al compartir el enlace."],
  ["whatsapp", "Número de WhatsApp Business de pedidos: 57 + el celular, sin espacios ni signos."],
  ["envio_ciudades", "A dónde envías. Ejemplo: Popayán y todo Colombia."],
  ["envio_costo", "Costo del envío en pesos, solo números. Vacío = se confirma por WhatsApp."],
  ["envio_gratis_desde", "Desde qué valor de compra el envío es gratis. Vacío = no aplica."],
  ["envio_tiempo", "Cuánto tarda el envío. Ejemplo: 1 a 3 días hábiles."],
  ["recogida_lugar", "Dónde se puede recoger. Vacío = sin recogida."],
  ["vendedor_nombre", "Quién vende (lo pide la ley)."],
  ["vendedor_documento", "NIT o cédula del vendedor."],
  ["vendedor_ciudad", "Ciudad del vendedor."],
  ["correo", "Correo para peticiones, quejas y reclamos."],
  ["instagram", "Usuario de Instagram sin @. Vacío = no se muestra."],
  ["tiktok", "Usuario de TikTok sin @. Vacío = no se muestra."],
  ["horario", "Cuándo respondes por WhatsApp."],
  ["pago", "Cómo te pagan. Ejemplo: Nequi, Bancolombia o contraentrega."],
];

var COLUMNAS_PEDIDOS = ["Fecha", "Pedido", "Cliente", "Entrega", "Dirección o lugar", "Producto", "Marca aliada", "Colección", "Talla", "Color", "Cantidad", "Precio", "Subtotal", "Total del pedido", "Estado", "Notas"];
var ESTADOS = ["pendiente", "pagado", "enviado", "entregado", "cancelado"];

/* ---------- Menú ---------- */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Tienda")
    .addItem("Configurar la hoja", "configurar")
    .addItem("Publicar la tienda ahora", "reconstruirAhora")
    .addSeparator()
    .addItem("Activar la publicación automática", "instalarActivadores")
    .addToUi();
}

/* ---------- 1. Configuración ---------- */

function configurar() {
  var libro = SpreadsheetApp.getActive();

  var productos = hoja_(libro, PESTANAS.productos, COLUMNAS_PRODUCTOS);
  validarLista_(productos, "S2:S", ["active", "draft"]);
  validarLista_(productos, "G2:G", ["TRUE", "FALSE"]);
  productos.getRange("M2:O").setNumberFormat("0");

  hoja_(libro, PESTANAS.colaboraciones, COLUMNAS_COLABORACIONES);
  validarLista_(libro.getSheetByName(PESTANAS.colaboraciones), "K2:K", ["visible", "pronto", "oculta"]);

  var tienda = hoja_(libro, PESTANAS.tienda, ["Clave", "Valor", "Para qué sirve"]);
  if (tienda.getLastRow() < 2) {
    tienda.getRange(2, 1, CLAVES_TIENDA.length, 3).setValues(CLAVES_TIENDA.map(function (c) { return [c[0], "", c[1]]; }));
  }
  tienda.setColumnWidth(2, 280);
  tienda.setColumnWidth(3, 520);

  var pedidos = hoja_(libro, PESTANAS.pedidos, COLUMNAS_PEDIDOS);
  pedidos.getRange("A2:A").setNumberFormat("dd/mm/yyyy hh:mm");
  pedidos.getRange("L2:N").setNumberFormat("$#,##0");
  validarLista_(pedidos, "O2:O", ESTADOS);

  configurarResumen_(libro);
  SpreadsheetApp.getActive().toast("Hoja lista. Sigue la guía para publicar las pestañas y la aplicación web.", "Tienda", 8);
}

function hoja_(libro, nombre, columnas) {
  var h = libro.getSheetByName(nombre) || libro.insertSheet(nombre);
  if (h.getLastRow() === 0) {
    h.getRange(1, 1, 1, columnas.length).setValues([columnas]);
  }
  h.getRange(1, 1, 1, columnas.length).setFontWeight("bold").setBackground("#111110").setFontColor("#F3F2EF");
  h.setFrozenRows(1);
  return h;
}

function validarLista_(h, rango, valores) {
  var regla = SpreadsheetApp.newDataValidation().requireValueInList(valores, true).setAllowInvalid(false).build();
  h.getRange(rango).setDataValidation(regla);
}

function configurarResumen_(libro) {
  var h = libro.getSheetByName(PESTANAS.resumen) || libro.insertSheet(PESTANAS.resumen);
  h.clear();
  h.getRange("A1").setValue("Resumen de ventas").setFontSize(16).setFontWeight("bold");
  h.getRange("A2").setValue("Cuenta los pedidos pagados, enviados o entregados. Cambia el mes en B3 (por ejemplo 2026-11).").setFontColor("#5B5A56");


  h.getRange("A3:B9").setValues([
    ["Mes (AAAA-MM)", ""],
    ["Desde", ""],
    ["Hasta", ""],
    ["", ""],
    ["Ventas del mes", ""],
    ["Pedidos del mes", ""],
    ["Pedidos pendientes", ""],
  ]);
  h.getRange("B3").setFormula('=TEXT(TODAY(),"yyyy-mm")');
  h.getRange("B4").setFormula("=DATE(VALUE(LEFT(B3,4)),VALUE(RIGHT(B3,2)),1)").setNumberFormat("dd/mm/yyyy");
  h.getRange("B5").setFormula("=EDATE(B4,1)").setNumberFormat("dd/mm/yyyy");
  h.getRange("B7").setFormula('=SUMIFS(Pedidos!M:M,Pedidos!A:A,">="&B4,Pedidos!A:A,"<"&B5,Pedidos!O:O,"<>pendiente",Pedidos!O:O,"<>cancelado")').setNumberFormat("$#,##0");
  h.getRange("B8").setFormula('=IFERROR(COUNTUNIQUE(FILTER(Pedidos!B2:B,Pedidos!A2:A>=B4,Pedidos!A2:A<B5,Pedidos!O2:O<>"cancelado")),0)');
  h.getRange("B9").setFormula('=IFERROR(COUNTUNIQUE(FILTER(Pedidos!B2:B,Pedidos!O2:O="pendiente")),0)');
  h.getRange("A7:A9").setFontWeight("bold");
  h.getRange("B7").setFontWeight("bold").setFontSize(14);

  h.getRange("A11").setValue("Ventas por marca aliada").setFontWeight("bold");
  h.getRange("A12").setFormula(consultaDelMes_("G, sum(K), sum(M)", "group by G order by sum(M) desc label G 'Marca aliada', sum(K) 'Unidades', sum(M) 'Ventas'"));
  h.getRange("E11").setValue("Lo más vendido").setFontWeight("bold");
  h.getRange("E12").setFormula(consultaDelMes_("F, sum(K), sum(M)", "group by F order by sum(K) desc limit 10 label F 'Producto', sum(K) 'Unidades', sum(M) 'Ventas'"));
  h.getRange("C12:C40").setNumberFormat("$#,##0");
  h.getRange("G12:G40").setNumberFormat("$#,##0");
  h.setColumnWidth(1, 220);
  h.setColumnWidth(5, 220);
}

// QUERY sobre Pedidos limitada al mes de B4:B5 y a pedidos pagados, enviados o entregados.
function consultaDelMes_(columnas, resto) {
  var where = "where A >= date '\"&TEXT($B$4,\"yyyy-mm-dd\")&\"' and A < date '\"&TEXT($B$5,\"yyyy-mm-dd\")&\"' and O <> 'pendiente' and O <> 'cancelado' ";
  return '=IFERROR(QUERY(Pedidos!A2:P,"select ' + columnas + " " + where + resto + '",0),"Sin ventas en este mes")';
}

/* ---------- 2. Registro de pedidos ---------- */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    var p = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var codigo = String(p.codigo || "");
    if (!/^\d{4}-[A-Z0-9]{4}$/.test(codigo)) return respuesta_({ ok: false, error: "codigo" });
    var lineas = Array.isArray(p.lineas) ? p.lineas.slice(0, 40) : [];
    if (lineas.length === 0) return respuesta_({ ok: false, error: "lineas" });

    var hoja = SpreadsheetApp.getActive().getSheetByName(PESTANAS.pedidos);
    if (!hoja) return respuesta_({ ok: false, error: "sin pestaña Pedidos" });

    // Un pedido se anota una sola vez aunque el cliente toque «enviar» dos veces.
    var ultimo = hoja.getLastRow();
    if (ultimo > 1) {
      var inicio = Math.max(2, ultimo - 299);
      var codigos = hoja.getRange(inicio, 2, ultimo - inicio + 1, 1).getValues();
      for (var i = 0; i < codigos.length; i++) if (String(codigos[i][0]) === codigo) return respuesta_({ ok: true, repetido: true });
    }

    var precios = preciosDeLaHoja_();
    var entrega = p.entrega === "recogida" ? "Recogida" : "Envío";
    var lugar = p.entrega === "recogida" ? "En tienda" : texto_(p.direccion, 200);
    var total = numero_(p.total);
    var ahora = new Date();
    var filas = lineas.map(function (l) {
      var cantidad = Math.max(1, Math.min(99, Math.round(numero_(l.cantidad))));
      var precio = numero_(l.precio);
      var notas = [];
      var clave = [String(l.handle || "").toLowerCase(), texto_(l.talla, 20), texto_(l.color, 40)].join("|");
      if (precios[clave] !== undefined && precios[clave] !== precio) notas.push("Precio en la hoja: $" + precios[clave].toLocaleString("es-CO"));
      if (p.nota) notas.push(texto_(p.nota, 200));
      return [ahora, codigo, texto_(p.nombre, 80), entrega, lugar, texto_(l.titulo, 120), texto_(l.marca, 80), texto_(l.coleccion, 120), texto_(l.talla, 20), texto_(l.color, 40), cantidad, precio, cantidad * precio, total, "pendiente", notas.join(" · ")];
    });
    hoja.getRange(ultimo + 1, 1, filas.length, filas[0].length).setValues(filas);
    return respuesta_({ ok: true });
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return respuesta_({ ok: true, servicio: "registro de pedidos" });
}

function preciosDeLaHoja_() {
  var h = SpreadsheetApp.getActive().getSheetByName(PESTANAS.productos);
  var mapa = {};
  if (!h || h.getLastRow() < 2) return mapa;
  var datos = h.getDataRange().getValues();
  var col = {};
  datos[0].forEach(function (n, i) { col[n] = i; });
  var handle = "", nombres = ["", ""], precio = 0;
  for (var r = 1; r < datos.length; r++) {
    var f = datos[r];
    var hh = String(f[col["Handle"]] || "").toLowerCase();
    if (hh !== handle) { handle = hh; nombres = [String(f[col["Option1 Name"]] || "").toLowerCase(), String(f[col["Option2 Name"]] || "").toLowerCase()]; }
    if (f[col["Variant Price"]] !== "") precio = Number(String(f[col["Variant Price"]]).replace(/[.,]\d{1,2}$/, "").replace(/[^\d]/g, ""));
    var v1 = String(f[col["Option1 Value"]] || ""), v2 = String(f[col["Option2 Value"]] || "");
    var talla = /talla|size/.test(nombres[0]) ? v1 : /talla|size/.test(nombres[1]) ? v2 : "";
    var color = /color/.test(nombres[0]) ? v1 : /color/.test(nombres[1]) ? v2 : "";
    if (v1 || v2) mapa[[handle, talla, color].join("|")] = precio;
  }
  return mapa;
}

// Evita que un texto que empieza por =, +, - o @ se convierta en fórmula.
function texto_(v, max) {
  var s = String(v == null ? "" : v).replace(/[\r\n\t]+/g, " ").trim().slice(0, max || 200);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function numero_(v) {
  var n = Number(v);
  return isFinite(n) && n >= 0 ? Math.round(n) : 0;
}

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- 3. Publicación automática (opcional) ---------- */

// Cuando Sergio edita el catálogo, se anota la hora. Cada 10 minutos se revisa: si pasaron
// 8 minutos sin más cambios (lo que tarda Google en actualizar el CSV publicado),
// se le pide a Cloudflare Pages que publique la tienda otra vez.

function marcarCambio(e) {
  var nombre = e && e.range ? e.range.getSheet().getName() : "";
  if ([PESTANAS.productos, PESTANAS.colaboraciones, PESTANAS.tienda].indexOf(nombre) === -1) return;
  PropertiesService.getScriptProperties().setProperty("CAMBIO_PENDIENTE", String(Date.now()));
}

function revisarPublicacion() {
  var props = PropertiesService.getScriptProperties();
  var pendiente = Number(props.getProperty("CAMBIO_PENDIENTE") || 0);
  if (!pendiente || Date.now() - pendiente < 8 * 60 * 1000) return;
  if (publicar_()) props.deleteProperty("CAMBIO_PENDIENTE");
}

function reconstruirAhora() {
  var ok = publicar_();
  SpreadsheetApp.getActive().toast(ok ? "Listo: la tienda se publica en unos minutos." : "Falta DEPLOY_HOOK_URL en las propiedades del script.", "Tienda", 6);
}

function publicar_() {
  var url = PropertiesService.getScriptProperties().getProperty("DEPLOY_HOOK_URL");
  if (!url) return false;
  var r = UrlFetchApp.fetch(url, { method: "post", muteHttpExceptions: true });
  return r.getResponseCode() < 300;
}

function instalarActivadores() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (["marcarCambio", "revisarPublicacion"].indexOf(t.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("marcarCambio").forSpreadsheet(SpreadsheetApp.getActive()).onEdit().create();
  ScriptApp.newTrigger("revisarPublicacion").timeBased().everyMinutes(10).create();
  SpreadsheetApp.getActive().toast("Publicación automática activada.", "Tienda", 5);
}
