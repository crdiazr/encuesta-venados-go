// Funciones compartidas entre la página de votación y el panel de administración.
(function () {
  const C = window.CONFIG || {};
  const pendiente = (v) => !v || String(v).startsWith("PEGA_AQUI");
  const configurado = !pendiente(C.SUPABASE_URL) && !pendiente(C.SUPABASE_KEY);

  if (C.COLOR) document.documentElement.style.setProperty("--acento", C.COLOR);
  if (C.COLOR_TEXTO_BOTON) document.documentElement.style.setProperty("--acento-tinta", C.COLOR_TEXTO_BOTON);

  function crearCliente(opcionesAuth) {
    return window.supabase.createClient(String(C.SUPABASE_URL).trim(), String(C.SUPABASE_KEY).trim(), {
      auth: Object.assign({ detectSessionInUrl: false }, opcionesAuth),
    });
  }

  // Convierte los mensajes técnicos de Supabase en mensajes claros en español.
  function traducirError(error) {
    const m = String((error && (error.message || error.msg || error.error_description)) || error || "");
    let r;
    if ((r = m.match(/after (\d+) seconds?/i))) return `Por seguridad, espera ${r[1]} segundos antes de pedir otro código.`;
    if (/rate limit|too many/i.test(m)) return "Se enviaron demasiados correos en poco tiempo. Intenta de nuevo en unos minutos.";
    if (/not authorized/i.test(m)) return "El sitio todavía no puede enviar correos a esta dirección. (Administrador: falta configurar el envío de correos en Supabase, ver README paso 3.)";
    if (/expired|invalid.*(otp|token)|token.*(invalid|expired)/i.test(m)) return "El código es incorrecto o ya expiró. Revísalo o pide uno nuevo.";
    if (/signups? not allowed|signup.*disabled/i.test(m)) return "El registro por correo está desactivado. (Administrador: actívalo en Supabase > Authentication > Sign In / Providers > Email.)";
    if (/unable to validate email|invalid.*email|email.*invalid/i.test(m)) return "Ese correo no parece válido.";
    if (/failed to fetch|networkerror|load failed/i.test(m)) return "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.";
    if (/permission denied/i.test(m)) return "No tienes permiso para hacer esto.";
    if (/invalid api key|no api key/i.test(m)) return "La llave de Supabase en config.js no es correcta.";
    return m || "Ocurrió un error inesperado. Intenta de nuevo.";
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const correoValido = (c) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(c);
  const numero = (n) => "#" + String(n == null ? "" : n).padStart(3, "0");
  const formato = (n) => Number(n || 0).toLocaleString("es-MX");
  const $ = (sel, raiz) => (raiz || document).querySelector(sel);

  function cargando(boton, activo, texto) {
    if (activo) {
      boton.dataset.texto = boton.textContent;
      boton.textContent = texto || "Un momento…";
      boton.disabled = true;
      boton.setAttribute("aria-busy", "true");
    } else {
      boton.textContent = boton.dataset.texto || boton.textContent;
      boton.disabled = false;
      boton.removeAttribute("aria-busy");
    }
  }

  function mensaje(el, texto, tipo) {
    el.textContent = texto || "";
    el.dataset.tipo = tipo || "error";
    el.hidden = !texto;
  }

  function aplicarTextos() {
    document.querySelectorAll("[data-config]").forEach((el) => {
      const v = C[el.dataset.config];
      if (v) el.textContent = v;
    });
    document.querySelectorAll("img[data-logo]").forEach((img) => {
      if (C.LOGO) img.src = C.LOGO; else img.remove();
    });
    if (C.NOMBRE_SITIO) document.title = document.title.replace("{sitio}", C.NOMBRE_SITIO);
  }

  function avisoSinConfigurar(el) {
    el.hidden = false;
    el.innerHTML = "<strong>Falta conectar la base de datos.</strong> Abre <code>config.js</code> y pega tu Project URL y tu Publishable key de Supabase (README, paso 2.6).";
  }

  window.App = { C, configurado, crearCliente, traducirError, esc, correoValido, numero, formato, $, cargando, mensaje, aplicarTextos, avisoSinConfigurar };
})();
