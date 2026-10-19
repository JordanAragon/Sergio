import { useStore } from "@nanostores/preact";
import { useEffect, useState } from "preact/hooks";
import { $cajonAbierto, $unidades } from "../stores/pedido";
import Icono from "./Icono";

export default function BotonPedido() {
  const unidades = useStore($unidades);
  // El build no conoce el pedido del cliente: el número aparece después de hidratar.
  const [listo, setListo] = useState(false);
  useEffect(() => setListo(true), []);
  const n = listo ? unidades : 0;
  return (
    <button
      type="button"
      class="icono-boton"
      aria-label={n ? `Ver pedido, ${n} ${n === 1 ? "producto" : "productos"}` : "Ver pedido"}
      aria-haspopup="dialog"
      onClick={() => $cajonAbierto.set(true)}
    >
      <Icono nombre="bolsa" />
      {n > 0 && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "4px",
            right: "2px",
            minWidth: "18px",
            height: "18px",
            padding: "0 5px",
            borderRadius: "9px",
            background: "var(--acento)",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
          }}
        >
          {n}
        </span>
      )}
    </button>
  );
}
