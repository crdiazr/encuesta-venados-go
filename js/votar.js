// Página de votación: elegir personaje → nombre y correo → código → voto registrado.
(function () {
  const { C, configurado, crearCliente, traducirError, esc, correoValido, numero, $, cargando, mensaje, aplicarTextos, avisoSinConfigurar } = window.App;
  aplicarTextos();

  const rejilla = $("#rejilla"), estado = $("#estado-lista"), chips = $("#grupos"), buscar = $("#buscar");
  const barra = $("#barra-seleccion"), dialogo = $("#dialogo");
  const pasos = { datos: $("#paso-datos"), codigo: $("#paso-codigo"), resultado: $("#paso-resultado") };
  const palabra = C.PALABRA_PERSONAJE || "personaje";
  const CLAVE_LOCAL = "votacion:ya-voto";

  if (!configurado) { avisoSinConfigurar($("#aviso-config")); return; }

  // La sesión del votante vive solo en memoria: se usa para confirmar el voto y se cierra al terminar.
  const sb = crearCliente({ persistSession: false, autoRefreshToken: false });

  let grupos = [], grupoActual = null, seleccionado = null, correoPendiente = "", temporizador = null;
  const cache = new Map();

  try {
    const previo = JSON.parse(localStorage.getItem(CLAVE_LOCAL) || "null");
    if (previo && previo.personaje) {
      const a = $("#aviso-ya-voto");
      a.hidden = false;
      a.textContent = `Desde este navegador ya se votó por ${previo.personaje}. Si eres otra persona, puedes votar con tu propio correo.`;
    }
  } catch (_) {}

  // ---------- Grupos ----------
  async function cargarGrupos() {
    estado.textContent = "Cargando…";
    const { data, error } = await sb.from("grupos").select("id,nombre,subtitulo").order("orden");
    if (error) { estado.textContent = traducirError(error); return; }
    grupos = data || [];
    if (!grupos.length) { estado.textContent = "Todavía no hay personajes cargados. (Administrador: corre el archivo 2 en Supabase, README paso 2.4.)"; return; }
    chips.innerHTML = grupos.map((g) =>
      `<button class="chip" role="tab" aria-selected="false" data-id="${g.id}"><strong>${esc(g.nombre)}</strong>${g.subtitulo ? `<span>${esc(g.subtitulo)}</span>` : ""}</button>`
    ).join("");
    elegirGrupo(grupos[0].id);
  }

  chips.addEventListener("click", (e) => {
    const b = e.target.closest(".chip");
    if (!b) return;
    buscar.value = "";
    elegirGrupo(Number(b.dataset.id));
  });

  async function elegirGrupo(id) {
    grupoActual = id;
    chips.querySelectorAll(".chip").forEach((c) => {
      const activo = Number(c.dataset.id) === id;
      c.setAttribute("aria-selected", String(activo));
      if (activo) c.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    const g = grupos.find((x) => x.id === id);
    if (!cache.has(id)) {
      esqueletos();
      const { data, error } = await sb.from("personajes").select("id,nombre,imagen_url,numero,grupo_id").eq("grupo_id", id).order("numero").order("nombre").limit(1000);
      if (error) { rejilla.innerHTML = ""; estado.textContent = traducirError(error); return; }
      cache.set(id, data || []);
    }
    if (grupoActual !== id || buscar.value.trim()) return;
    const lista = cache.get(id);
    estado.textContent = `${g ? g.nombre : ""}${g && g.subtitulo ? " · " + g.subtitulo : ""} — ${lista.length} ${palabra}`;
    pintar(lista);
  }

  // ---------- Búsqueda ----------
  let espera;
  buscar.addEventListener("input", () => {
    clearTimeout(espera);
    espera = setTimeout(buscarAhora, 250);
  });

  async function buscarAhora() {
    const q = buscar.value.trim();
    if (!q) { elegirGrupo(grupoActual); return; }
    chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-selected", "false"));
    estado.textContent = "Buscando…";
    let consulta = sb.from("personajes").select("id,nombre,imagen_url,numero,grupo_id").order("numero").limit(60);
    consulta = /^#?\d+$/.test(q) ? consulta.eq("numero", Number(q.replace("#", ""))) : consulta.ilike("nombre", `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`);
    const { data, error } = await consulta;
    if (q !== buscar.value.trim()) return;
    if (error) { estado.textContent = traducirError(error); return; }
    estado.textContent = data.length ? `${data.length === 60 ? "Primeros 60" : data.length} resultado${data.length === 1 ? "" : "s"} para “${q}”` : `No encontramos “${q}”.`;
    pintar(data);
  }

  // ---------- Tarjetas ----------
  function esqueletos() {
    rejilla.innerHTML = Array.from({ length: 12 }, () => '<div class="esqueleto" aria-hidden="true"></div>').join("");
  }

  function pintar(lista) {
    const nombreGrupo = (id) => (grupos.find((g) => g.id === id) || {}).nombre || "";
    rejilla.innerHTML = lista.map((p) => `
      <button class="tarjeta" type="button" data-id="${p.id}" aria-pressed="${seleccionado && seleccionado.id === p.id}" title="${esc(nombreGrupo(p.grupo_id))}">
        <span class="marca-elegido" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></span>
        <span class="foto">${p.imagen_url ? `<img src="${esc(p.imagen_url)}" alt="" loading="lazy" width="200" height="200" onerror="this.style.visibility='hidden'">` : ""}</span>
        <span class="num">${p.numero != null ? numero(p.numero) : ""}</span>
        <span class="nombre">${esc(p.nombre)}</span>
      </button>`).join("");
    rejilla._lista = lista;
  }

  rejilla.addEventListener("click", (e) => {
    const t = e.target.closest(".tarjeta");
    if (!t) return;
    const p = (rejilla._lista || []).find((x) => x.id === Number(t.dataset.id));
    if (!p) return;
    seleccionado = p;
    rejilla.querySelectorAll(".tarjeta").forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
    $("#sel-img").src = p.imagen_url || "";
    $("#sel-nombre").textContent = p.nombre;
    $("#btn-votar").textContent = "Votar";
    barra.hidden = false;
  });

  // ---------- Diálogo ----------
  function mostrarPaso(nombre) {
    Object.entries(pasos).forEach(([k, el]) => (el.hidden = k !== nombre));
  }

  $("#btn-votar").addEventListener("click", () => {
    if (!seleccionado) return;
    $("#dlg-img").src = seleccionado.imagen_url || "";
    $("#dlg-nombre").textContent = seleccionado.nombre;
    mensaje($("#msg-datos"), "");
    mostrarPaso("datos");
    dialogo.showModal();
    setTimeout(() => $("#usuario").focus(), 30);
  });

  dialogo.addEventListener("click", (e) => {
    if (e.target.closest("[data-cerrar]")) cerrarDialogo();
  });
  dialogo.addEventListener("close", () => clearInterval(temporizador));

  function cerrarDialogo() {
    dialogo.close();
    sb.auth.signOut({ scope: "local" }).catch(() => {});
  }

  pasos.datos.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#msg-datos"), usuario = $("#usuario").value.trim(), correo = $("#correo").value.trim().toLowerCase();
    if (usuario.length < 2) return mensaje(msg, `Escribe tu ${C.ETIQUETA_USUARIO ? C.ETIQUETA_USUARIO.charAt(0).toLowerCase() + C.ETIQUETA_USUARIO.slice(1) : "nombre de usuario"}.`);
    if (!correoValido(correo)) return mensaje(msg, "Escribe un correo válido.");
    if (!$("#acepto").checked) return mensaje(msg, "Para votar necesitas aceptar el aviso de privacidad.");
    mensaje(msg, "");
    const boton = $("#btn-enviar");
    cargando(boton, true, "Enviando código…");
    const { error } = await sb.auth.signInWithOtp({ email: correo, options: { shouldCreateUser: true } });
    cargando(boton, false);
    if (error) return mensaje(msg, traducirError(error));
    correoPendiente = correo;
    $("#correo-enviado").textContent = correo;
    $("#codigo").value = "";
    mensaje($("#msg-codigo"), "");
    mostrarPaso("codigo");
    iniciarEspera(60);
    setTimeout(() => $("#codigo").focus(), 30);
  });

  function iniciarEspera(segundos) {
    const b = $("#btn-reenviar");
    clearInterval(temporizador);
    let s = segundos;
    b.disabled = true;
    b.textContent = `Reenviar código (${s} s)`;
    temporizador = setInterval(() => {
      s -= 1;
      if (s <= 0) { clearInterval(temporizador); b.disabled = false; b.textContent = "Reenviar código"; }
      else b.textContent = `Reenviar código (${s} s)`;
    }, 1000);
  }

  $("#btn-reenviar").addEventListener("click", async () => {
    const msg = $("#msg-codigo");
    const { error } = await sb.auth.signInWithOtp({ email: correoPendiente, options: { shouldCreateUser: true } });
    if (error) return mensaje(msg, traducirError(error));
    mensaje(msg, "Te enviamos un código nuevo.", "exito");
    iniciarEspera(60);
  });

  $("#btn-cambiar").addEventListener("click", () => { clearInterval(temporizador); mostrarPaso("datos"); });

  $("#codigo").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); });

  pasos.codigo.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#msg-codigo"), codigo = $("#codigo").value.replace(/\D/g, "");
    if (codigo.length < 6) return mensaje(msg, "El código tiene al menos 6 dígitos.");
    const boton = $("#btn-confirmar");
    cargando(boton, true, "Confirmando…");
    const v = await sb.auth.verifyOtp({ email: correoPendiente, token: codigo, type: "email" });
    if (v.error) { cargando(boton, false); return mensaje(msg, traducirError(v.error)); }
    const { data, error } = await sb.rpc("emitir_voto", { p_personaje_id: seleccionado.id, p_nombre_usuario: $("#usuario").value.trim() });
    cargando(boton, false);
    await sb.auth.signOut({ scope: "local" }).catch(() => {});
    if (error) return mensaje(msg, traducirError(error));
    mostrarResultado(data);
  });

  function mostrarResultado(r) {
    const nuevo = r && r.estado === "ok";
    const personaje = (r && r.personaje) || seleccionado.nombre;
    $("#res-img").src = nuevo ? seleccionado.imagen_url || "" : "";
    $("#res-img").hidden = !nuevo || !seleccionado.imagen_url;
    $("#res-titulo").textContent = nuevo ? "¡Voto registrado!" : "Este correo ya votó";
    $("#res-texto").textContent = nuevo
      ? `Gracias por votar por ${personaje}.`
      : `Ya habías votado por ${personaje} con este correo. Solo se cuenta un voto por entrenador.`;
    try { localStorage.setItem(CLAVE_LOCAL, JSON.stringify({ personaje })); } catch (_) {}
    mostrarPaso("resultado");
    barra.hidden = true;
    seleccionado = null;
    rejilla.querySelectorAll(".tarjeta").forEach((x) => x.setAttribute("aria-pressed", "false"));
  }

  cargarGrupos();
})();
