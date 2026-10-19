import { useStore } from "@nanostores/preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { $cajonAbierto, $lineas, $vivo, cambiarCantidad, cargarVivo, quitar, vaciar } from "../stores/pedido";
import { codigoPedido, costoEnvio, detalleLinea, enlaceWhatsApp, mensajePedido, pesos, subtotal, unidades, type Datos, type Linea } from "../lib/pedido";
import type { Tienda } from "../datos/catalogo";
import { disponible } from "../lib/variantes";
import { srcBase } from "../lib/imagenes";
import Icono from "./Icono";

type TiendaCajon = Pick<Tienda, "nombre" | "whatsapp" | "envioCosto" | "envioGratisDesde" | "recogidaLugar" | "envioCiudades" | "pago">;

const CLAVE_DATOS = "pedido:datos:v1";

function leerDatosGuardados(): { nombre: string; direccion: string } {
  try {
    const raw = localStorage.getItem(CLAVE_DATOS);
    const d = raw ? JSON.parse(raw) : null;
    return { nombre: String(d?.nombre ?? ""), direccion: String(d?.direccion ?? "") };
  } catch {
    return { nombre: "", direccion: "" };
  }
}

async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function registrar(url: string, codigo: string, lineas: Linea[], datos: Datos, envio: number | null) {
  if (!url) return;
  const sub = subtotal(lineas);
  const cuerpo = JSON.stringify({
    codigo,
    fecha: new Date().toISOString(),
    nombre: datos.nombre,
    entrega: datos.entrega.tipo,
    direccion: datos.entrega.tipo === "envio" ? datos.entrega.direccion : "",
    nota: datos.nota ?? "",
    envio,
    subtotal: sub,
    total: sub + (envio ?? 0),
    lineas: lineas.map(({ titulo, handle, sku, marca, coleccion, talla, color, cantidad, precio }) => ({ titulo, handle, sku, marca, coleccion, talla, color, cantidad, precio })),
  });
  try {
    const blob = new Blob([cuerpo], { type: "text/plain;charset=utf-8" });
    if (navigator.sendBeacon?.(url, blob)) return;
  } catch {
    /* se intenta con fetch */
  }
  fetch(url, { method: "POST", mode: "no-cors", keepalive: true, headers: { "Content-Type": "text/plain;charset=utf-8" }, body: cuerpo }).catch(() => {});
}

export default function CajonPedido({ tienda, registro }: { tienda: TiendaCajon; registro: string }) {
  const abierto = useStore($cajonAbierto);
  const lineas = useStore($lineas);
  const vivo = useStore($vivo);
  const ref = useRef<HTMLDialogElement>(null);

  const conRecogida = !!tienda.recogidaLugar;
  const [entrega, setEntrega] = useState<"envio" | "recogida">("envio");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [nota, setNota] = useState("");
  const [errores, setErrores] = useState<{ nombre?: string; direccion?: string }>({});
  const [codigo, setCodigo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [verMensaje, setVerMensaje] = useState(false);

  useEffect(() => {
    const d = leerDatosGuardados();
    setNombre(d.nombre);
    setDireccion(d.direccion);
    setCodigo(codigoPedido());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE_DATOS, JSON.stringify({ nombre, direccion }));
    } catch {
      /* sin almacenamiento */
    }
  }, [nombre, direccion]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      d.showModal();
      cargarVivo();
    } else if (!abierto && d.open) d.close();
  }, [abierto]);

  // Precios y unidades al día con la hoja publicada.
  const agotadas = useMemo(() => {
    const set = new Set<string>();
    if (!vivo) return set;
    for (const l of lineas) {
      const p = vivo.get(l.handle);
      const v = p?.variantes.find((x) => x.talla === l.talla && x.color === l.color);
      if (!p || !disponible(v)) set.add(`${l.handle}|${l.talla}|${l.color}`);
    }
    return set;
  }, [vivo, lineas]);

  useEffect(() => {
    if (!vivo) return;
    let cambio = false;
    const nuevas = lineas.map((l) => {
      const v = vivo.get(l.handle)?.variantes.find((x) => x.talla === l.talla && x.color === l.color);
      if (v && v.precio !== l.precio) {
        cambio = true;
        return { ...l, precio: v.precio };
      }
      return l;
    });
    if (cambio) $lineas.set(nuevas);
  }, [vivo]);

  const datos: Datos = { nombre: nombre.trim(), entrega: entrega === "envio" ? { tipo: "envio", direccion: direccion.trim() } : { tipo: "recogida" }, nota };
  const validas = lineas.filter((l) => !agotadas.has(`${l.handle}|${l.talla}|${l.color}`));
  const envio = costoEnvio(validas, entrega, tienda);
  const sub = subtotal(validas);
  const mensaje = mensajePedido(codigo, validas, { ...datos, nombre: datos.nombre || "[tu nombre]", entrega: datos.entrega.tipo === "envio" ? { tipo: "envio", direccion: datos.entrega.direccion || "[ciudad y dirección]" } : datos.entrega }, tienda);
  const hayAgotadas = agotadas.size > 0;

  function validar(): boolean {
    const e: typeof errores = {};
    if (!datos.nombre) e.nombre = "Escribe tu nombre.";
    if (entrega === "envio" && datos.entrega.tipo === "envio" && datos.entrega.direccion.length < 6) e.direccion = "Escribe la ciudad, el barrio y la dirección.";
    setErrores(e);
    if (e.nombre) document.getElementById("pedido-nombre")?.focus();
    else if (e.direccion) document.getElementById("pedido-direccion")?.focus();
    return !e.nombre && !e.direccion;
  }

  function enviar(ev: MouseEvent) {
    if (hayAgotadas || validas.length === 0 || !validar()) {
      ev.preventDefault();
      return;
    }
    registrar(registro, codigo, validas, datos, envio);
    setEnviado(true);
  }

  async function alCopiar() {
    if (!enviado && !validar()) return;
    const ok = await copiar(mensaje);
    setCopiado(ok);
    if (ok && !enviado) {
      registrar(registro, codigo, validas, datos, envio);
      setEnviado(true);
    }
    setTimeout(() => setCopiado(false), 2500);
  }

  function terminar() {
    vaciar();
    setEnviado(false);
    setNota("");
    setCodigo(codigoPedido());
    $cajonAbierto.set(false);
  }

  return (
    <dialog ref={ref} class="cajon" aria-labelledby="titulo-pedido" onClose={() => $cajonAbierto.set(false)} onClick={(e) => e.target === ref.current && $cajonAbierto.set(false)}>
      <div class="cajon-cuerpo">
        <div class="cajon-asa" aria-hidden="true" />
        <div class="cajon-cabeza">
          <h2 id="titulo-pedido">{enviado ? "Pedido listo" : "Tu pedido"}</h2>
          <button type="button" class="icono-boton" aria-label="Cerrar" onClick={() => $cajonAbierto.set(false)}>
            <Icono nombre="cerrar" />
          </button>
        </div>

        {enviado ? (
          <div class="cajon-enviado">
            <p>
              Abrimos WhatsApp con tu pedido <strong>#{codigo}</strong>. Envía el mensaje y te respondemos para confirmar disponibilidad, pago y entrega.
            </p>
            <p class="suave">¿No se abrió WhatsApp? Copia el pedido y pégalo en el chat de {tienda.nombre}.</p>
            <div class="cajon-botones">
              <a class="boton boton--whatsapp" href={enlaceWhatsApp(tienda.whatsapp, mensaje)} target="_blank" rel="noopener">
                <Icono nombre="whatsapp" /> Abrir WhatsApp otra vez
              </a>
              <button type="button" class="boton boton--claro" onClick={alCopiar}>
                <Icono nombre={copiado ? "ok" : "copiar"} /> {copiado ? "Pedido copiado" : "Copiar pedido"}
              </button>
              <button type="button" class="boton" onClick={terminar}>
                Ya lo envié: vaciar el pedido
              </button>
              <button type="button" class="enlace" onClick={() => setEnviado(false)}>
                Volver al pedido
              </button>
            </div>
          </div>
        ) : lineas.length === 0 ? (
          <div class="cajon-vacio">
            <p>Tu pedido está vacío.</p>
            <p class="suave">Elige un producto, su talla y su color, y agrégalo aquí.</p>
            <button type="button" class="boton boton--claro" onClick={() => $cajonAbierto.set(false)}>
              Seguir viendo
            </button>
          </div>
        ) : (
          <>
            <ul class="cajon-lineas">
              {lineas.map((l) => {
                const agotada = agotadas.has(`${l.handle}|${l.talla}|${l.color}`);
                return (
                  <li key={`${l.handle}|${l.talla}|${l.color}`} class={agotada ? "agotada" : undefined}>
                    <a class="miniatura" href={`/producto/${l.handle}`} tabIndex={-1} aria-hidden="true">
                      {l.imagen ? <img src={srcBase(l.imagen, 200)} alt="" width={76} height={95} loading="lazy" /> : <span class="sin-foto">Foto</span>}
                    </a>
                    <div class="linea-info">
                      <div class="sobretitulo linea-colab">{l.coleccion}</div>
                      <a class="linea-titulo" href={`/producto/${l.handle}`}>
                        {l.titulo}
                      </a>
                      <div class="suave">{detalleLinea(l)}</div>
                      {agotada && <div class="aviso-agotada">Esta talla se agotó. Quítala para enviar el pedido.</div>}
                      <div class="linea-pie">
                        <div class="cantidad" role="group" aria-label={`Cantidad de ${l.titulo}`}>
                          <button type="button" aria-label={l.cantidad === 1 ? "Quitar del pedido" : "Quitar uno"} onClick={() => cambiarCantidad(l, l.cantidad - 1)}>
                            <Icono nombre={l.cantidad === 1 ? "basura" : "menos"} tam={18} />
                          </button>
                          <span aria-live="polite">{l.cantidad}</span>
                          <button type="button" aria-label="Agregar uno" onClick={() => cambiarCantidad(l, l.cantidad + 1)} disabled={agotada}>
                            <Icono nombre="mas" tam={18} />
                          </button>
                        </div>
                        <strong>{pesos(l.precio * l.cantidad)}</strong>
                      </div>
                      {agotada && (
                        <button type="button" class="enlace" onClick={() => quitar(l)}>
                          Quitar
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {conRecogida && (
              <fieldset class="entrega">
                <legend>¿Cómo lo recibes?</legend>
                <div class="entrega-opciones">
                  <button type="button" class="chip" aria-pressed={entrega === "envio"} onClick={() => setEntrega("envio")}>
                    Envío a domicilio
                  </button>
                  <button type="button" class="chip" aria-pressed={entrega === "recogida"} onClick={() => setEntrega("recogida")}>
                    Recoger en {tienda.recogidaLugar}
                  </button>
                </div>
              </fieldset>
            )}

            <div class="campos">
              <label class="campo">
                Tu nombre
                <input id="pedido-nombre" type="text" autocomplete="name" placeholder="Nombre y apellido" value={nombre} onInput={(e) => {
                    setNombre(e.currentTarget.value);
                    if (errores.nombre) setErrores({ ...errores, nombre: undefined });
                  }} aria-invalid={!!errores.nombre} aria-describedby={errores.nombre ? "error-nombre" : undefined} />
                {errores.nombre && (
                  <span class="error" id="error-nombre">
                    {errores.nombre}
                  </span>
                )}
              </label>
              {entrega === "envio" && (
                <label class="campo">
                  Ciudad y dirección
                  <input id="pedido-direccion" type="text" autocomplete="street-address" placeholder="Ciudad, barrio y dirección" value={direccion} onInput={(e) => {
                      setDireccion(e.currentTarget.value);
                      if (errores.direccion) setErrores({ ...errores, direccion: undefined });
                    }} aria-invalid={!!errores.direccion} aria-describedby={errores.direccion ? "error-direccion" : undefined} />
                  {errores.direccion && (
                    <span class="error" id="error-direccion">
                      {errores.direccion}
                    </span>
                  )}
                </label>
              )}
              <label class="campo">
                Nota (opcional)
                <input type="text" placeholder="Ejemplo: es para regalo" value={nota} onInput={(e) => setNota(e.currentTarget.value)} />
              </label>
            </div>

            <dl class="totales">
              <div>
                <dt>Productos ({unidades(validas)})</dt>
                <dd>{pesos(sub)}</dd>
              </div>
              <div>
                <dt>Envío</dt>
                <dd>{envio === null ? "Por confirmar" : envio === 0 ? (entrega === "recogida" ? "Sin costo" : "Gratis") : pesos(envio)}</dd>
              </div>
              <div class="total">
                <dt>Total</dt>
                <dd>
                  {pesos(sub + (envio ?? 0))}
                  {envio === null && <span class="suave"> + envío</span>}
                </dd>
              </div>
            </dl>
            {tienda.envioGratisDesde !== null && entrega === "envio" && sub < tienda.envioGratisDesde && <p class="suave pista">Te faltan {pesos(tienda.envioGratisDesde - sub)} para el envío gratis.</p>}

            <div class="mensaje">
              <button type="button" class="mensaje-titulo" aria-expanded={verMensaje} onClick={() => setVerMensaje(!verMensaje)}>
                Así llega el mensaje a WhatsApp <span aria-hidden="true">{verMensaje ? "−" : "+"}</span>
              </button>
              {verMensaje && <pre>{mensaje}</pre>}
            </div>

            <div class="cajon-botones">
              <a class="boton boton--whatsapp" href={enlaceWhatsApp(tienda.whatsapp, mensaje)} target="_blank" rel="noopener" onClick={enviar} aria-disabled={hayAgotadas || validas.length === 0}>
                <Icono nombre="whatsapp" /> Enviar pedido por WhatsApp
              </a>
              <button type="button" class="boton boton--claro" onClick={alCopiar} disabled={hayAgotadas}>
                <Icono nombre={copiado ? "ok" : "copiar"} /> {copiado ? "Pedido copiado" : "Copiar pedido"}
              </button>
            </div>
            <p class="suave letra-chica">
              Te respondemos por WhatsApp para confirmar disponibilidad, pago{tienda.pago ? ` (${tienda.pago})` : ""} y entrega. Puedes retractarte dentro de los 5 días hábiles siguientes a la entrega. <a href="/envios-y-cambios">Envíos y cambios</a>.
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}
