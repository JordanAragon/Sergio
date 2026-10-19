// Fotos: Sergio pega en la hoja el enlace de la foto. Sirve una URL directa (.jpg, .png, .webp),
// una ruta del sitio (/productos/foto.jpg) o el enlace de compartir de Google Drive
// (archivo con «Cualquier persona con el enlace»), que se convierte en una URL de imagen.

const DRIVE = [/drive\.google\.com\/file\/d\/([\w-]{10,})/, /drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([\w-]{10,})/, /lh3\.googleusercontent\.com\/d\/([\w-]{10,})/];

export function imagenDirecta(url: string | undefined): string | null {
  const u = (url ?? "").trim();
  if (!u) return null;
  for (const re of DRIVE) {
    const m = u.match(re);
    if (m) return `https://lh3.googleusercontent.com/d/${m[1]}`;
  }
  if (u.startsWith("/") || /^https?:\/\//.test(u)) return u;
  return null;
}

const ANCHOS = [400, 800, 1200, 1600];

/** srcset para fotos de Drive (aceptan el ancho en la URL). Para otras URL devuelve undefined. */
export function srcset(url: string): string | undefined {
  if (!url.startsWith("https://lh3.googleusercontent.com/d/")) return undefined;
  return ANCHOS.map((w) => `${url}=w${w} ${w}w`).join(", ");
}

export function srcBase(url: string, ancho = 800): string {
  return url.startsWith("https://lh3.googleusercontent.com/d/") ? `${url}=w${ancho}` : url;
}
