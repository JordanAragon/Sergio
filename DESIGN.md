# Diseño

Dirección elegida para el mockup (2026-10-18): **A · galería neutra** con los **sellos de colaboración** de la dirección C. Lienzo del mockup: https://claude.ai/artifact/PAPir1pJ25JdGFn1Qwpr3R. Investigación: brain David-AI, `references/sergio/referencias-diseno-2026-10-18.md`.

## Principios
- El producto manda: fondo hueso, fotos grandes 4:5, poca decoración.
- Cada colaboración aporta un solo color (portada, sello, acento del contador y de los pasos). El resto de la interfaz es tinta sobre papel.
- El sello «Tienda × Marca» es la firma visual. Con logo de la marca aliada, el logo reemplaza el recuadro punteado.
- Celular primero: objetivos táctiles de 44 px o más, barra fija de «Agregar al pedido», cajón inferior para el pedido.

## Tokens (`src/styles/global.css`)
| Token | Valor | Uso |
|---|---|---|
| `--papel` | `#F3F2EF` | Fondo |
| `--superficie` | `#FFFFFF` | Tarjetas de formulario, tallas, guía |
| `--tinta` | `#111110` | Texto, botones, franja superior, pie |
| `--gris` | `#5B5A56` | Texto secundario |
| `--linea` / `--borde` | `#DCDAD4` / `#C9C6BE` | Separadores y bordes |
| `--foto` | `#E4E1DA` | Fondo de fotos y marcadores |
| `--whatsapp` | `#128C4A` | Enviar por WhatsApp y botón flotante |
| `--acento` | color de la colaboración | Se fija por página |

Colores de colaboración del ejemplo: vino `#7A1C2C` (calzado), cobalto `#1E3FBF` (camisetas), oliva `#2F3A2A` (belleza). Cada uno se define en la pestaña Colaboraciones.

## Tipografía
Archivo variable (ancho 62–125, peso 100–900), servida desde el propio sitio.
- Títulos: 800, ancho 112 %, interletrado −0,02 em, interlineado 0,98–1.
- Nombre de la tienda y sobretítulos: mayúsculas, ancho 125 %, interletrado 0,08–0,14 em.
- Texto: 400–600, 14–16 px.

## Componentes
Encabezado fijo (menú lateral en celular, navegación en computador), portadas de colaboración, tarjeta de producto (2.ª foto al pasar el cursor, etiqueta Nuevo/Oferta/Últimas unidades/Agotado), chips de filtro, ficha (galería con deslizamiento, colores en círculos, tallas en botones con agotadas tachadas, guía en cm), cajón del pedido (hoja inferior en celular, panel derecho en computador), pie con datos legales y enlace a la SIC.

## Movimiento
Solo transiciones cortas (cajón, menú, segunda foto). Se apagan con `prefers-reduced-motion`.
