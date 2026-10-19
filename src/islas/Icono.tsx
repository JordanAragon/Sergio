import { ICONOS, type NombreIcono } from "../lib/iconos";

export default function Icono({ nombre, tam = 22, grosor = 1.6 }: { nombre: NombreIcono; tam?: number; grosor?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={grosor} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {ICONOS[nombre].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
