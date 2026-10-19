# Manual del catálogo

Para Sergio. Todo se hace en la hoja de Google, desde el celular (app Hojas de cálculo) o el computador. La tienda se actualiza sola.

## Cómo está armada la hoja

- **Productos:** una fila por cada talla y color de un producto.
- **Colaboraciones:** una fila por sección de la tienda (calzado, camisetas…) con su marca aliada.
- **Tienda:** nombre, WhatsApp, envíos y tus datos de vendedor.
- **Pedidos:** se llena sola con cada pedido que te envían.
- **Resumen:** ventas del mes, lo más vendido y ventas por marca aliada.

## Subir un producto

Ejemplo: un tacón en negro y nude, tallas 36 a 38.

| Handle | Title | Vendor | Type | Tags | Option1 Name | Option1 Value | Option2 Name | Option2 Value | Variant Inventory Qty | Variant Price | Image Src |
|---|---|---|---|---|---|---|---|---|---|---|---|
| tacon-bloque | Tacón bloque | Marca aliada | Tacones | calzado, nuevo | Talla | 36 | Color | Negro | 3 | 169900 | enlace de la foto |
| tacon-bloque | | | | | | 37 | | Negro | 2 | 169900 | |
| tacon-bloque | | | | | | 38 | | Nude | 1 | 169900 | |

- **Handle:** el nombre del producto en minúsculas y con guiones. Es la dirección de la página (`/producto/tacon-bloque`). Se repite en todas las filas del producto y no se cambia después.
- **Title, Vendor, Type, Tags:** solo en la primera fila.
  - **Vendor:** la marca aliada.
  - **Type:** el tipo (Tacones, Sandalias, Camisetas). Sale como filtro en la sección.
  - **Tags:** la sección (el Handle de la colaboración, por ejemplo `calzado`). Agrega `nuevo` para que salga en «Lo nuevo» y `destacado` para que salga primero.
- **Variant Price:** solo números, sin puntos ni signo: `169900`. Si todas las tallas valen lo mismo, basta con ponerlo en la primera fila.
- **Variant Compare At Price:** el precio de antes, si está en oferta. La tienda lo muestra tachado.
- **Body (HTML):** una descripción corta: material, altura del tacón, para qué ocasión. Texto normal, sin códigos.

## Tallas agotadas y unidades

- Pon en **Variant Inventory Qty** cuántas unidades tienes de esa talla y color.
- Con **0**, la talla sale tachada y no se puede pedir. Cuando todas están en 0, el producto sale «Agotado».
- Si dejas la casilla vacía, la talla siempre está disponible.
- Con 3 unidades o menos, la tarjeta dice «Últimas unidades».

## Ocultar un producto

En la primera fila, pon **Status** en `draft`. Para mostrarlo otra vez, `active`.

## Fotos

1. Sube las fotos a una carpeta de Google Drive.
2. En cada foto: Compartir › Acceso general › «Cualquier persona con el enlace».
3. Copia el enlace y pégalo en **Image Src**. Para varias fotos del mismo producto, agrega filas con solo el Handle, la foto en Image Src y el orden en **Image Position** (1, 2, 3…).
4. Para que al elegir un color se vea su foto, pega la foto de ese color en **Variant Image** de una de sus filas.

Fotos que se ven bien: el producto completo, fondo claro y liso, luz de día, foto vertical.

## Los pedidos

Cada pedido llega a tu WhatsApp con un número (por ejemplo `#1019-K7Q2`) y queda en la pestaña Pedidos como «pendiente». Cuando te paguen, cambia el estado a `pagado`; luego a `enviado` y `entregado`. Si no se concreta, `cancelado`.

Después de vender, baja las unidades en Productos.

## El resumen

La pestaña Resumen muestra el mes actual. Para ver otro mes, escribe en B3 el año y el mes, por ejemplo `2026-11`. «Ventas por marca aliada» sirve para cuadrar cuentas con cada marca.

## Cuándo se ve el cambio en la tienda

- Precio y unidades: unos 5 minutos (lo que tarda Google en actualizar la hoja publicada).
- Producto nuevo, sección nueva o cambio de nombre: unos 10 a 15 minutos, cuando la tienda se vuelve a publicar.

## Si algo no se ve

- Revisa que el Handle sea igual en todas las filas del producto y que Status diga `active`.
- Revisa que el precio sea solo números.
- Si sigue igual después de 15 minutos, escríbele a Aragon.
