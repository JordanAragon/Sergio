# Tienda de Sergio — reglas para agentes

Lee `README.md`, `PRODUCT.md` y `DESIGN.md` antes de cambiar algo.

## Contexto

- Cliente de Aragon (la agencia de David). Propuesta AR-PT-2026-001: catálogo con pedido por WhatsApp, panel en Google Sheets, registro de pedidos, resumen por marca aliada, páginas legales, QR, estadísticas y formato listo para Shopify. Precio cerrado; lo que no está en la propuesta no se agrega sin que David lo apruebe.
- Estado y decisiones en el brain `JordanAragon/David-AI`: `brain/proyectos/aragon.md` (Prospectos › Sergio) y las sesiones. Ciclo: leer el brain → trabajar → registrar en el brain.

## Reglas

- Español en el código, la interfaz y los commits.
- Nada inventado: ni marcas, ni precios, ni clientes, ni reseñas. Lo que falta va entre corchetes (`[Nombre]`) hasta que Sergio lo confirme. Los datos de `datos/` son de ejemplo y el sitio lo avisa.
- La pestaña Productos conserva las columnas de la importación de Shopify. No se agregan columnas propias ahí: lo extra va en Tags, en Colaboraciones o en Tienda.
- Sin secretos en el repo. Las URL de la hoja y del registro son públicas por naturaleza; el deploy hook va solo en las propiedades del Apps Script.
- Las islas no importan `src/datos/catalogo.ts` de forma estática (arrastra el lector de CSV); usan `src/lib/variantes.ts`.
- Todo sitio de David lleva Open Graph completo (1200×630, URL absolutas) y favicon propio.

## Verificación

- `pnpm test`, `pnpm check` y `pnpm build` sin errores.
- Cambios de interfaz: `pnpm preview` y `pnpm verificar` (375, 768 y 1440 px, sin scroll horizontal, sin errores de consola, pedido de punta a punta). Revisar las capturas de `capturas/`.

## Commits

- Autor y committer: `Jordan David Micolta Aragón <jordandavidaragon@outlook.com>`.
- Sin `Co-Authored-By`, `Claude-Session` ni ninguna línea que nombre a Claude u otra herramienta, en commits ni en PR.
- Trabajo en ramas y PR; David integra.
