// =====================================================================
//  CONFIGURACIÓN DEL SITIO — es el único archivo que necesitas editar.
//  Puedes editarlo directo en GitHub (abre el archivo y presiona el lápiz).
// =====================================================================
window.CONFIG = {
  // 1) De Supabase > Project Settings > API Keys / Data API. Ver README, paso 2.6.
  SUPABASE_URL: "https://lhootucrflcafdcdorrb.supabase.co",          // se ve como https://abcdefgh.supabase.co
  SUPABASE_KEY: "sb_publishable_N3GT4bjob2PMZ64WTAKBnw_RfK4BF-g",      // empieza con sb_publishable_ (o la "anon" key)

  // 2) Textos del sitio. Cámbialos cuando uses otros personajes.
  NOMBRE_SITIO: "Vota por tu favorito",
  TITULO: "Encuesta de la Comunidad de Venados Go",
  DESCRIPCION: "¿El más fuerte? ¿el más cute? elige tu Pokémon favorito de todos los tiempos. Solo se permite un voto por entrenador.",
  ETIQUETA_USUARIO: "Usuario de Pokémon GO",   // cómo se llama el campo de nombre al votar
  PALABRA_GRUPO: "generación",        // cómo se llaman las categorías (generación, temporada, equipo...)
  PALABRA_PERSONAJE: "Pokémon",       // cómo se llaman los personajes

  // 3) Apariencia y contacto
  LOGO: "img/logo.webp",              // logotipo junto al título (deja "" para no mostrarlo)
  COLOR: "#64c0e4",                   // color principal del sitio (azul del logotipo)
  COLOR_TEXTO_BOTON: "#0b2a38",       // texto sobre el color principal (oscuro si el color es claro)
  CORREO_CONTACTO: "",                // aparece en el aviso de privacidad (opcional)
  NOTA_DERECHOS: "Proyecto personal sin fines de lucro. Pokémon y los nombres de sus personajes son marcas de Nintendo, Game Freak y The Pokémon Company. Imágenes y datos: PokéAPI."
};
