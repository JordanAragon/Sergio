# Tienda de Sergio

Catálogo en línea con pedido por WhatsApp para la tienda multimarca de Sergio Alejandro Micolta (calzado de dama, camisetas y, más adelante, belleza). Cada sección es una colaboración con una marca aliada. Lo construye Aragon según la propuesta AR-PT-2026-001.

- **Sitio:** Astro estático con islas Preact (poco JavaScript, rápido en celulares de gama media).
- **Datos:** una hoja de Google que Sergio edita desde el celular. La pestaña Productos usa las columnas de la importación de Shopify: migrar es exportar el CSV e importarlo.
- **Pedidos:** el cliente arma el pedido y se abre WhatsApp con el mensaje listo; el pedido queda además en la pestaña Pedidos de la hoja.
- **Publicación:** Cloudflare Pages (sin mensualidad y permite uso comercial).

## Comandos

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm test         # pruebas del catálogo y del pedido
pnpm check        # tipos
pnpm build        # sitio en dist/
pnpm preview      # sirve dist/ en http://localhost:4321
pnpm verificar    # recorre 375/768/1440 px y prueba el pedido (necesita Playwright)
pnpm exportar:shopify  # CSV listo para Shopify
```

Sin variables de entorno, el sitio usa los datos de ejemplo de `datos/` y muestra el aviso «Vista de prueba». Con la hoja configurada (`.env.example`), lee la hoja en el build y vuelve a leer precios y unidades en el navegador.

## Estructura

| Ruta | Qué es |
|---|---|
| `src/datos/catalogo.ts` | Lee las pestañas (formato Shopify) y arma productos, variantes y colaboraciones |
| `src/datos/fuente.ts` | Fuente del build: hoja publicada o `datos/` |
| `src/lib/pedido.ts` | Totales, envío, código y mensaje de WhatsApp |
| `src/islas/` | Botón y cajón del pedido, compra en la ficha (Preact) |
| `src/pages/` | Inicio, colaboración, producto, lo nuevo, buscar, páginas legales, QR, Open Graph e íconos |
| `hoja/` | Apps Script de la hoja (pestañas, registro de pedidos, resumen, publicación automática) y guía de instalación |
| `docs/manual-del-catalogo.md` | Manual para Sergio |
| `datos/` | Datos de ejemplo con las mismas columnas que la hoja |

## Publicar en Cloudflare Pages

1. Workers & Pages › Crear › Pages › conectar el repo `JordanAragon/Sergio`.
2. Build: `pnpm build`; salida: `dist`. Variable `NODE_VERSION=22`.
3. Variables: `SITIO_URL` (dominio), las tres `PUBLIC_CSV_*`, `PUBLIC_REGISTRO_PEDIDOS_URL`.
4. Dominio propio: Custom domains › agregar el dominio de Sergio.
5. Web Analytics: activarlo en el proyecto (sin cookies).
6. Deploy hook para la publicación automática: ver `hoja/README.md`.
