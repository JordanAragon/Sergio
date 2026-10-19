import { useStore } from "@nanostores/preact";
import { useEffect, useState } from "preact/hooks";
import { $cajonAbierto, $vivo, agregar, cargarVivo } from "../stores/pedido";
import type { Variante } from "../datos/catalogo";
import { disponible } from "../lib/variantes";
import { muestraColor } from "../lib/colores";
import { pesos } from "../lib/pedido";

type Props = {
  handle: string;
  titulo: string;
  marca: string;
  sello: string;
  imagen: string | null;
  variantes: Variante[];
  colores: string[];
  tallas: string[];
  conGuia: boolean;
};

export default function Compra(props: Props) {
  const vivo = useStore($vivo);
  const variantes = vivo?.get(props.handle)?.variantes ?? props.variantes;
  const colores = props.colores;
  const tallas = props.tallas;

  const primerColor = colores.find((c) => variantes.some((v) => v.color === c && disponible(v))) ?? colores[0] ?? "";
  const [color, setColor] = useState(primerColor);
  const [talla, setTalla] = useState<string | null>(tallas.length === 0 ? "" : null);
  const [agregado, setAgregado] = useState(false);

  useEffect(() => {
    cargarVivo();
    document.body.classList.add("con-barra");
    return () => document.body.classList.remove("con-barra");
  }, []);

  const buscar = (t: string | null, c: string) => variantes.find((v) => (tallas.length === 0 || v.talla === t) && (colores.length === 0 || v.color === c));
  const elegida = talla === null ? undefined : buscar(talla, color);
  const lista = disponible(elegida);
  const delColor = variantes.filter((v) => colores.length === 0 || v.color === color);
  const precio = elegida?.precio ?? Math.min(...(delColor.length ? delColor : variantes).map((v) => v.precio));
  const antes = elegida ? elegida.precioAntes : (delColor[0]?.precioAntes ?? null);
  const precioVaria = new Set(variantes.map((v) => v.precio)).size > 1;

  function elegirColor(c: string) {
    setColor(c);
    if (talla && !disponible(buscar(talla, c))) setTalla(null);
    document.dispatchEvent(new CustomEvent("galeria:color", { detail: c }));
  }

  function agregarAlPedido() {
    if (!elegida || !lista) return;
    agregar({
      handle: props.handle,
      titulo: props.titulo,
      coleccion: props.sello,
      marca: props.marca,
      sku: elegida.sku,
      talla: elegida.talla,
      color: elegida.color,
      precio: elegida.precio,
      cantidad: 1,
      imagen: elegida.imagen ?? props.imagen,
    });
    setAgregado(true);
    setTimeout(() => setAgregado(false), 2000);
    $cajonAbierto.set(true);
  }

  const todoAgotado = !variantes.some((v) => disponible(v));

  return (
    <div class="compra">
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
          <strong style={{ fontSize: "22px" }}>
            {!elegida && precioVaria ? "Desde " : ""}
            {pesos(precio)}
          </strong>
          {antes && (
            <s class="suave" aria-label={`Antes ${pesos(antes)}`}>
              {pesos(antes)}
            </s>
          )}
        </div>
        {elegida && lista && elegida.unidades !== null && elegida.unidades <= 2 && <div class="unidades-pocas">{elegida.unidades === 1 ? "Queda 1" : `Quedan ${elegida.unidades}`} en esta talla</div>}
      </div>

      {colores.length > 0 && (
        <div>
          <div class="compra-titulo" id="titulo-color">
            Color: <span>{color}</span>
          </div>
          <div class="colores" role="group" aria-labelledby="titulo-color">
            {colores.map((c) => {
              const hex = muestraColor(c);
              const sinStock = !variantes.some((v) => v.color === c && disponible(v));
              return (
                <button key={c} type="button" class="color" aria-pressed={c === color} aria-label={`${c}${sinStock ? ", agotado" : ""}`} onClick={() => elegirColor(c)} title={c}>
                  {hex ? <span class="punto" style={{ background: hex === "transparent" ? "repeating-linear-gradient(45deg,#fff 0 4px,#ddd 4px 8px)" : hex, opacity: sinStock ? 0.4 : 1 }} /> : <span class="nombre-color">{c}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tallas.length > 0 && (
        <div>
          <div class="tallas-cabeza">
            <div class="compra-titulo" id="titulo-talla">
              Talla: <span>{talla ?? "elige una"}</span>
            </div>
            {props.conGuia && <a href="#guia">Guía de tallas</a>}
          </div>
          <div class="tallas" role="group" aria-labelledby="titulo-talla">
            {tallas.map((t) => {
              const v = buscar(t, color);
              const off = !disponible(v);
              return (
                <button key={t} type="button" class="talla" aria-pressed={t === talla} disabled={off} aria-label={`Talla ${t}${off ? ", agotada" : ""}`} onClick={() => setTalla(t)}>
                  {t}
                </button>
              );
            })}
          </div>
          <p class="compra-nota">Tachadas: agotadas.{props.conGuia ? " ¿Quedas entre dos tallas? Pide la mayor." : ""}</p>
        </div>
      )}

      <div class="compra-barra">
        {todoAgotado ? (
          <button type="button" class="boton" disabled>
            Agotado
          </button>
        ) : lista ? (
          <button type="button" class="boton" onClick={agregarAlPedido}>
            {agregado ? "Agregado ✓" : `Agregar al pedido${elegida?.talla ? ` · talla ${elegida.talla}` : ""}`}
          </button>
        ) : (
          <button type="button" class="boton" aria-disabled="true" onClick={() => document.getElementById("titulo-talla")?.scrollIntoView({ block: "center", behavior: "smooth" })}>
            Elige una talla
          </button>
        )}
      </div>
    </div>
  );
}
