// Panel de administración: inicio de sesión por código, resultados, ranking y administradores.
(function () {
  const { C, configurado, crearCliente, traducirError, esc, correoValido, numero, formato, $, cargando, mensaje, aplicarTextos, avisoSinConfigurar } = window.App;
  aplicarTextos();

  if (!configurado) { avisoSinConfigurar($("#aviso-config")); return; }

  const sb = crearCliente({ persistSession: true, autoRefreshToken: true, storageKey: "votacion-admin" });
  const vistaLogin = $("#vista-login"), vistaPanel = $("#vista-panel");
  const palabraGrupo = C.PALABRA_GRUPO || "grupo";
  const Mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  let correoActual = "", correoPendiente = "", limite = 100, total = 0, filasRanking = [], intervalo = null;

  $("#titulo-por-grupo").textContent = `Votos por ${palabraGrupo}`;
  $("#th-grupo").textContent = Mayus(palabraGrupo);

  // ---------- Sesión ----------
  async function iniciar() {
    const { data } = await sb.auth.getSession();
    if (data.session) await entrar(data.session);
    else mostrarLogin();
  }

  function mostrarLogin(texto) {
    clearInterval(intervalo);
    vistaPanel.hidden = true;
    vistaLogin.hidden = false;
    $("#form-correo").hidden = false;
    $("#form-codigo").hidden = true;
    $("#sesion-correo").textContent = "";
    mensaje($("#msg-login"), texto || "");
  }

  async function entrar(sesion) {
    const { data: esAdmin, error } = await sb.rpc("es_admin");
    if (error || !esAdmin) {
      await sb.auth.signOut({ scope: "local" });
      mostrarLogin(error ? traducirError(error) : "Este correo no está registrado como administrador.");
      return;
    }
    correoActual = (sesion.user.email || "").toLowerCase();
    $("#sesion-correo").textContent = correoActual;
    vistaLogin.hidden = true;
    vistaPanel.hidden = false;
    await Promise.all([cargarResumen(), cargarRanking(), cargarAdmins()]);
    clearInterval(intervalo);
    intervalo = setInterval(() => { if (!document.hidden) { cargarResumen(); cargarRanking(); } }, 60000);
  }

  $("#form-correo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const correo = $("#login-correo").value.trim().toLowerCase(), msg = $("#msg-login");
    if (!correoValido(correo)) return mensaje(msg, "Escribe un correo válido.");
    const b = $("#btn-login");
    cargando(b, true, "Enviando código…");
    const { error } = await sb.auth.signInWithOtp({ email: correo, options: { shouldCreateUser: true } });
    cargando(b, false);
    if (error) return mensaje(msg, traducirError(error));
    correoPendiente = correo;
    $("#login-enviado").textContent = correo;
    $("#form-correo").hidden = true;
    $("#form-codigo").hidden = false;
    mensaje($("#msg-codigo"), "");
    $("#login-codigo").value = "";
    $("#login-codigo").focus();
  });

  $("#login-codigo").addEventListener("input", (e) => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); });
  $("#btn-otro-correo").addEventListener("click", () => mostrarLogin());

  $("#form-codigo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const codigo = $("#login-codigo").value.replace(/\D/g, ""), msg = $("#msg-codigo");
    if (codigo.length < 6) return mensaje(msg, "El código tiene al menos 6 dígitos.");
    const b = $("#btn-verificar");
    cargando(b, true, "Verificando…");
    const { data, error } = await sb.auth.verifyOtp({ email: correoPendiente, token: codigo, type: "email" });
    cargando(b, false);
    if (error) return mensaje(msg, traducirError(error));
    await entrar(data.session);
  });

  $("#btn-salir").addEventListener("click", async () => {
    await sb.auth.signOut({ scope: "local" });
    mostrarLogin("Cerraste sesión.");
    $("#msg-login").dataset.tipo = "info";
  });

  $("#btn-actualizar").addEventListener("click", async (e) => {
    cargando(e.currentTarget, true, "Actualizando…");
    await Promise.all([cargarResumen(), cargarRanking(), cargarAdmins()]);
    cargando(e.currentTarget, false);
  });

  function errorPanel(error) {
    if (/solo los administradores/i.test(String(error && error.message))) {
      sb.auth.signOut({ scope: "local" });
      mostrarLogin("Tu acceso de administrador fue retirado.");
      return;
    }
    mensaje($("#msg-panel"), traducirError(error));
  }

  // ---------- Resumen ----------
  function haceCuanto(fecha) {
    const s = Math.round((Date.now() - new Date(fecha)) / 1000);
    if (s < 60) return "Hace unos segundos";
    if (s < 3600) return `Hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `Hace ${Math.floor(s / 3600)} h`;
    const d = Math.floor(s / 86400);
    return `Hace ${d} día${d === 1 ? "" : "s"}`;
  }

  async function cargarResumen() {
    const { data, error } = await sb.rpc("resumen_votos");
    if (error) return errorPanel(error);
    mensaje($("#msg-panel"), "");
    total = Number(data.total) || 0;
    $("#kpi-total").textContent = formato(total);
    $("#kpi-personajes").textContent = formato(data.personajes_votados);
    $("#kpi-personajes-detalle").textContent = total ? `De todos los ${C.PALABRA_PERSONAJE || "personajes"} disponibles` : "";
    $("#kpi-ultimo").textContent = data.ultimo_voto ? haceCuanto(data.ultimo_voto) : "Sin votos aún";
    $("#kpi-ultimo-detalle").textContent = data.ultimo_voto ? new Date(data.ultimo_voto).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "";
    $("#actualizado").textContent = "Actualizado " + new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }) + " · se actualiza solo cada minuto";

    const grupos = data.por_grupo || [];
    const filtro = $("#filtro-grupo"), valor = filtro.value;
    filtro.innerHTML = `<option value="">Todas las ${palabraGrupo === "generación" ? "generaciones" : "categorías"}</option>` +
      grupos.map((g) => `<option value="${g.id}">${esc(g.nombre)}</option>`).join("");
    filtro.value = valor;

    const max = Math.max(1, ...grupos.map((g) => Number(g.votos)));
    $("#barras-grupo").innerHTML = grupos.map((g) => {
      const v = Number(g.votos), pct = total ? (v / total) * 100 : 0;
      return `<li class="barra-fila" tabindex="0" aria-label="${esc(g.nombre)}: ${v} votos, ${pct.toFixed(1)}%">
        <span class="nom">${esc(g.nombre)}${g.subtitulo ? `<small>${esc(g.subtitulo)}</small>` : ""}</span>
        <span class="barra-pista"><span class="barra-relleno${v ? "" : " vacio"}" style="width:${(v / max) * 100}%"></span></span>
        <span class="cant">${formato(v)}</span>
        <span class="globo" role="tooltip">${esc(g.nombre)} · ${formato(v)} voto${v === 1 ? "" : "s"} · ${pct.toFixed(1)}%</span>
      </li>`;
    }).join("");
  }

  // ---------- Ranking ----------
  async function cargarRanking() {
    const g = $("#filtro-grupo").value;
    const { data, error } = await sb.rpc("ranking_personajes", { p_grupo_id: g ? Number(g) : null, p_limite: limite });
    if (error) return errorPanel(error);
    filasRanking = data || [];
    const tbody = $("#tabla-ranking");
    if (!filasRanking.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="vacio-estado">${g ? "Nadie ha votado todavía en este grupo." : "Todavía no hay votos. Comparte el enlace de la votación."}</td></tr>`;
    } else {
      const max = Math.max(1, ...filasRanking.map((r) => Number(r.votos)));
      tbody.innerHTML = filasRanking.map((r) => {
        const v = Number(r.votos), pct = total ? (v / total) * 100 : 0;
        return `<tr>
          <td class="pos">${r.posicion}</td>
          <td><div class="persona">${r.imagen_url ? `<img src="${esc(r.imagen_url)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : ""}<div><strong>${esc(r.nombre)}</strong><small>${r.numero != null ? numero(r.numero) : ""}</small></div></div></td>
          <td>${esc(r.grupo)}</td>
          <td class="num"><span class="mini-barra" aria-hidden="true"><span style="width:${(v / max) * 100}%"></span></span>${formato(v)}</td>
          <td class="num">${pct.toFixed(1)}%</td>
        </tr>`;
      }).join("");
    }
    $("#btn-mas").hidden = filasRanking.length < limite || limite >= 1000;
    $("#ranking-sub").textContent = filasRanking.length ? `${filasRanking.length} personaje${filasRanking.length === 1 ? "" : "s"} con votos · empates comparten lugar` : "Ordenado por número de votos";
  }

  $("#filtro-grupo").addEventListener("change", () => { limite = 100; cargarRanking(); });
  $("#btn-mas").addEventListener("click", () => { limite = Math.min(1000, limite + 200); cargarRanking(); });

  $("#btn-csv").addEventListener("click", () => {
    const filas = [["posicion", "personaje", "numero", palabraGrupo, "votos", "porcentaje"]].concat(
      filasRanking.map((r) => [r.posicion, r.nombre, r.numero, r.grupo, r.votos, total ? ((r.votos / total) * 100).toFixed(2) : "0"])
    );
    const csv = "﻿" + filas.map((f) => f.map((c) => `"${String(c == null ? "" : c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `ranking-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // ---------- Administradores ----------
  async function cargarAdmins() {
    const { data, error } = await sb.rpc("listar_administradores");
    if (error) return errorPanel(error);
    $("#lista-admins").innerHTML = (data || []).map((a) => {
      const yo = a.correo === correoActual;
      const fecha = new Date(a.agregado_en).toLocaleDateString("es-MX", { dateStyle: "medium" });
      return `<li><div><span class="correo">${esc(a.correo)}</span><small>Agregado ${esc(fecha)}${a.agregado_por ? " por " + esc(a.agregado_por) : ""}</small></div>
        ${yo ? '<span class="etiqueta-tu">Tú</span>' : `<button class="boton fantasma pequeno" data-quitar="${esc(a.correo)}">Quitar</button>`}</li>`;
    }).join("");
  }

  $("#form-admin").addEventListener("submit", async (e) => {
    e.preventDefault();
    const correo = $("#nuevo-admin").value.trim().toLowerCase(), msg = $("#msg-admin");
    if (!correoValido(correo)) return mensaje(msg, "Escribe un correo válido.");
    const b = $("#btn-agregar");
    cargando(b, true, "Agregando…");
    const { error } = await sb.rpc("agregar_administrador", { p_correo: correo });
    cargando(b, false);
    if (error) return mensaje(msg, traducirError(error));
    $("#nuevo-admin").value = "";
    mensaje(msg, `${correo} ya es administrador. Puede entrar a esta página con su correo.`, "exito");
    cargarAdmins();
  });

  $("#lista-admins").addEventListener("click", async (e) => {
    const b = e.target.closest("[data-quitar]");
    if (!b) return;
    const correo = b.dataset.quitar;
    if (!confirm(`¿Quitar a ${correo} como administrador?`)) return;
    const { error } = await sb.rpc("quitar_administrador", { p_correo: correo });
    if (error) return mensaje($("#msg-admin"), traducirError(error));
    mensaje($("#msg-admin"), `${correo} ya no es administrador.`, "info");
    cargarAdmins();
  });

  iniciar();
})();
