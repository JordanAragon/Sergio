/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CSV_PRODUCTOS?: string;
  readonly PUBLIC_CSV_COLABORACIONES?: string;
  readonly PUBLIC_CSV_TIENDA?: string;
  readonly PUBLIC_REGISTRO_PEDIDOS_URL?: string;
  readonly PUBLIC_CF_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
