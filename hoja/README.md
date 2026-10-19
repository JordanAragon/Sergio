# Instalar la hoja de la tienda

La hoja es el panel de Sergio: ahí carga productos, ve los pedidos y el resumen de ventas. Se crea **en la cuenta de Google de Sergio** para que quede a su nombre.

## 1. Crear la hoja

1. En Google Drive de Sergio: Nuevo › Hojas de cálculo. Nombre: «Tienda — catálogo y pedidos».
2. Extensiones › Apps Script. Borra lo que trae y pega `hoja/Codigo.gs`. Guarda.
3. En el editor, elige la función `configurar` y pulsa Ejecutar. Acepta los permisos (es el propio script de la hoja).
4. Vuelve a la hoja: ya tiene las pestañas Productos, Colaboraciones, Tienda, Pedidos y Resumen, y el menú «Tienda».
5. Para empezar con los datos de ejemplo: en cada pestaña, Archivo › Importar › Subir el CSV de `datos/` › «Reemplazar la hoja actual». Después se reemplazan por los productos reales.

## 2. Publicar el catálogo

Archivo › Compartir › Publicar en la web. Publica **por separado** las pestañas Productos, Colaboraciones y Tienda, cada una como «Valores separados por comas (.csv)». Copia cada enlace en las variables del sitio:

| Pestaña | Variable |
|---|---|
| Productos | `PUBLIC_CSV_PRODUCTOS` |
| Colaboraciones | `PUBLIC_CSV_COLABORACIONES` |
| Tienda | `PUBLIC_CSV_TIENDA` |

No publiques Pedidos ni Resumen: tienen datos de clientes.

Google tarda unos 5 minutos en reflejar un cambio en el CSV publicado.

## 3. Registro de pedidos

1. En Apps Script: Implementar › Nueva implementación › Tipo «Aplicación web».
2. Ejecutar como: **yo** (la cuenta de Sergio). Quién tiene acceso: **cualquier usuario**.
3. Copia la URL que termina en `/exec` en `PUBLIC_REGISTRO_PEDIDOS_URL`.

Cada pedido que un cliente envía por WhatsApp desde la tienda queda en la pestaña Pedidos con estado «pendiente», una fila por producto. Si el precio enviado no coincide con el de la hoja, lo anota en Notas. Sergio cambia el estado a pagado, enviado, entregado o cancelado; el Resumen cuenta solo pagados, enviados y entregados.

Si se cambia el código del script, hay que publicar una **nueva versión** de la misma implementación (Implementar › Gestionar implementaciones › Editar › Nueva versión) para que la URL siga igual.

## 4. Publicación automática (opcional)

Sin esto, los cambios de precio y de unidades igual se ven en la tienda (la página vuelve a leer la hoja), pero un producto nuevo necesita publicar el sitio otra vez.

1. En Cloudflare Pages: proyecto › Configuración › Builds › Deploy hooks › crea uno para la rama `main` y copia la URL.
2. En Apps Script: Configuración del proyecto › Propiedades del script › agrega `DEPLOY_HOOK_URL` con esa URL. No va en el repo.
3. En la hoja: menú Tienda › Activar la publicación automática.

Desde ahí, 8 minutos después del último cambio en Productos, Colaboraciones o Tienda, el sitio se publica solo. El menú Tienda › Publicar la tienda ahora lo hace en el momento.
