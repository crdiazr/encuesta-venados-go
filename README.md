# Vota por tu favorito

Sitio web para votar por un personaje favorito, con un panel privado de resultados.
Esta primera versión usa Pokémon (1,025 personajes en 9 generaciones, con datos e imágenes de [PokéAPI](https://pokeapi.co)), y está hecha para cambiar de personajes después sin tocar código.

- Los personajes se agrupan por **generación** y se pueden buscar por nombre o número.
- Cada persona vota **una sola vez**: escribe su usuario de Pokémon GO y su correo, recibe un código de 6 dígitos y el voto solo cuenta al confirmarlo.
- El **panel de administración** (`admin.html`) muestra el total de votos, votos por generación y el ranking. Solo los administradores pueden verlo, y desde ahí se agregan otros administradores por correo.

Todo funciona con servicios gratuitos y **no necesitas instalar nada** en tu computadora: se hace desde el navegador.

| Servicio | Para qué | Costo |
|---|---|---|
| GitHub | Guarda el código y publica el sitio (GitHub Pages) | Gratis |
| Supabase | Base de datos y verificación de correos | Gratis |
| Gmail | Envía los códigos de verificación | Gratis (hasta 500 correos al día) |

Tiempo aproximado: 40 minutos la primera vez.

---

## Paso 1. Subir el proyecto a GitHub y publicarlo

1. Crea una cuenta en [github.com](https://github.com) (si no tienes).
2. Arriba a la derecha, presiona **+** → **New repository**.
   - **Repository name:** `votaciones` (o el nombre que quieras; será parte de la dirección del sitio).
   - Elige **Public**.
   - Presiona **Create repository**.
3. En la página del repositorio nuevo, presiona el enlace **uploading an existing file**.
4. Descomprime el `.zip` en tu computadora, abre la carpeta `votaciones` y **arrastra todo su contenido** (las carpetas `css`, `js`, `supabase`, etc., y los archivos sueltos) a la página de GitHub. No arrastres la carpeta `votaciones` en sí, sino lo que tiene adentro.
5. Espera a que terminen de subir y presiona **Commit changes**.
6. Ve a **Settings** (pestaña del repositorio) → **Pages** (menú izquierdo).
   - En **Source** elige **Deploy from a branch**.
   - En **Branch** elige `main` y la carpeta `/ (root)`. Presiona **Save**.
7. Después de 1 o 2 minutos, recarga esa página: aparecerá la dirección de tu sitio, algo como
   `https://tu-usuario.github.io/votaciones/`. **Guárdala**, la usarás más adelante.

> Si abres el sitio ahora verás el aviso "Falta conectar la base de datos". Es normal: lo resuelves en el paso 2.6.

---

## Paso 2. Crear la base de datos en Supabase

### 2.1 Crear el proyecto
1. Entra a [supabase.com](https://supabase.com) → **Start your project**. Puedes registrarte con tu cuenta de GitHub.
2. Presiona **New project**.
   - **Name:** `votaciones`.
   - **Database Password:** presiona **Generate a password** y guárdala en un lugar seguro (casi no la usarás).
   - **Region:** la más cercana a tus votantes (para México, por ejemplo una de Estados Unidos).
3. Presiona **Create new project** y espera un par de minutos a que termine.

### 2.2 Abrir el editor de SQL
En el menú izquierdo abre **SQL Editor**. Aquí vas a pegar tres archivos de la carpeta `supabase`, en orden. Para cada uno:

1. Presiona **New query** (o el **+**).
2. Pega el contenido del archivo.
3. Presiona **Run**. Debe decir **Success**.

Para copiar un archivo fácilmente: ábrelo en tu repositorio de GitHub y usa el botón **Copy raw file** (el ícono de dos cuadritos, arriba a la derecha del archivo).

### 2.3 Archivo 1: `supabase/1-estructura.sql`
Crea las tablas y todas las reglas de seguridad. Si Supabase muestra una advertencia sobre "destructive operations", presiona **Run this query** para continuar (el archivo no borra datos).

### 2.4 Archivo 2: `supabase/2-personajes-pokemon.sql`
Carga los 1,025 Pokémon y las 9 generaciones. Es un archivo largo; está bien.

### 2.5 Archivo 3: `supabase/3-primer-administrador.sql`
Antes de presionar Run, **cambia `tu-correo@ejemplo.com` por tu correo**. Con ese correo entrarás al panel.

### 2.6 Conectar el sitio con la base de datos
1. En Supabase presiona el botón **Connect** (arriba), o ve a **Project Settings** → **Data API**, y copia la **Project URL** (se ve como `https://abcdefgh.supabase.co`).
2. Ve a **Project Settings** → **API Keys** y copia la **Publishable key** (empieza con `sb_publishable_`). Si solo ves la pestaña de llaves antiguas, copia la llamada **anon public**.
   - **Nunca** uses la llave **secret** ni la **service_role**. Esas no deben ir en el sitio.
3. En GitHub abre el archivo `config.js` y presiona el lápiz (**Edit this file**).
4. Reemplaza `PEGA_AQUI_TU_PROJECT_URL` y `PEGA_AQUI_TU_PUBLISHABLE_KEY` por lo que copiaste, dejando las comillas.
5. Presiona **Commit changes**. En 1 minuto tu sitio ya mostrará los Pokémon.

> La Publishable key está pensada para ir en sitios públicos: por sí sola no permite ver votos ni correos. La seguridad la ponen las reglas del archivo 1.

---

## Paso 3. Configurar el envío de códigos por correo

Supabase solo envía correos a los miembros de tu equipo hasta que conectas un servicio de correo propio. Usaremos un **Gmail personal**. Te recomiendo crear uno nuevo solo para este proyecto (por ejemplo `votaciones.pokemon@gmail.com`), y no usar un correo del trabajo.

### 3.1 Crear una "contraseña de aplicación" en Gmail
1. Entra a [myaccount.google.com](https://myaccount.google.com) con ese Gmail.
2. En **Seguridad**, activa la **Verificación en dos pasos** (es obligatoria para lo siguiente).
3. Busca **Contraseñas de aplicaciones** (puedes escribirlo en el buscador de arriba de la página).
4. Ponle un nombre, como `Supabase`, y presiona **Crear**.
5. Google te muestra una clave de 16 letras. **Cópiala** (sin espacios). Solo se muestra una vez.

### 3.2 Conectar Gmail en Supabase
En Supabase ve a **Authentication** → **Emails** → **SMTP Settings** y activa **Enable custom SMTP**. Llena así:

| Campo | Valor |
|---|---|
| Sender email | tu Gmail (ej. `votaciones.pokemon@gmail.com`) |
| Sender name | `Vota por tu favorito` (o el nombre de tu sitio) |
| Host | `smtp.gmail.com` |
| Port number | `465` |
| Username | tu Gmail completo |
| Password | la clave de 16 letras del paso 3.1 |

Presiona **Save changes**.

### 3.3 Hacer que el correo traiga un código (y no un enlace)
En **Authentication** → **Emails** → **Templates** hay que editar **dos** plantillas: **Magic Link** y **Confirm sign up** (la primera vez que alguien vota, Supabase usa la segunda). En cada una:

- **Subject:** `Tu código de verificación`
- **Body:** borra lo que tenga y pega esto:

```html
<h2>Tu código de verificación</h2>
<p>Escribe este código en la página para continuar:</p>
<p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
<p>Si no fuiste tú, puedes ignorar este correo.</p>
```

Presiona **Save** en cada una.

### 3.4 Subir el límite de correos por hora
Con correo propio, Supabase permite 30 correos por hora al inicio. Ve a **Authentication** → **Rate Limits** y sube **Rate limit for sending emails** a `150` (Gmail permite hasta 500 al día). Guarda.

### 3.5 Dirección del sitio
En **Authentication** → **URL Configuration**, pon en **Site URL** la dirección de tu sitio del paso 1.7 y guarda.

---

## Paso 4. Probar

1. Abre tu sitio, elige un Pokémon y vota con tu correo. Debe llegarte el código (revisa spam la primera vez).
2. Abre `https://tu-usuario.github.io/votaciones/admin.html`, entra con tu correo de administrador y verás tu voto en el ranking.
3. En **Administradores** puedes agregar a otras personas por correo. Ellas entran a la misma dirección `admin.html` con su correo.

¡Listo! Comparte la dirección del sitio con quien quieras que vote.

---

## Uso diario

- **Ver resultados:** entra a `admin.html`. Se actualiza solo cada minuto, y puedes descargar el ranking en CSV.
- **Reiniciar la votación:** en Supabase → SQL Editor, ejecuta `truncate public.votos;` (borra todos los votos).
- **Cambiar textos, logotipo o color:** edita `config.js` en GitHub. El sitio cambia solo entre modo claro y oscuro según la configuración del dispositivo de cada persona.
- **Proyecto en pausa:** Supabase pausa los proyectos gratuitos que pasan 7 días casi sin actividad (te avisa por correo). Para reactivarlo, entra al panel de Supabase y presiona **Resume project**; los datos se conservan.

## Cambiar a otros personajes

No hay que tocar código. Usa el archivo `supabase/4-cambiar-personajes.sql` como guía:

1. Prepara dos hojas de cálculo (Excel o Google Sheets) con las mismas columnas que las plantillas de la carpeta `plantillas/`:
   - `grupos.csv`: `id`, `nombre`, `subtitulo`, `orden` (las categorías, por ejemplo temporadas o equipos).
   - `personajes.csv`: `grupo_id`, `nombre`, `imagen_url`, `numero`.
   Las imágenes pueden ser enlaces a cualquier imagen pública, o puedes subirlas a una carpeta `img/` del repositorio y poner `img/nombre.png`.
2. Exporta cada hoja como CSV.
3. En Supabase → SQL Editor ejecuta la parte 1 de `4-cambiar-personajes.sql` (borra votos y personajes anteriores).
4. En **Table Editor** abre la tabla `grupos` → **Insert** → **Import data from CSV** y sube `grupos.csv`. Repite con la tabla `personajes` y `personajes.csv`.
5. En `config.js` cambia `TITULO`, `DESCRIPCION`, `ETIQUETA_USUARIO`, `PALABRA_GRUPO`, `PALABRA_PERSONAJE` y `NOTA_DERECHOS`. Si cambias el logotipo, sube la imagen nueva a la carpeta `img/` y pon su nombre en `LOGO`; el color principal se cambia en `COLOR`.

## Si algo no funciona

| Mensaje o problema | Solución |
|---|---|
| "Falta conectar la base de datos" | Revisa el paso 2.6 (`config.js`). |
| "El sitio todavía no puede enviar correos a esta dirección" | Falta el paso 3.2 (SMTP). |
| Llega un enlace en lugar de un código | Falta editar alguna de las dos plantillas del paso 3.3. |
| No llega el correo | Revisa spam. Verifica la clave de Gmail del paso 3.1 y que el Port sea `465`. |
| "Se enviaron demasiados correos" | Sube el límite del paso 3.4 o espera una hora. |
| "Este correo no está registrado como administrador" | Ese correo no está en la lista. Agrégalo desde el panel o con el archivo 3. |
| No aparecen personajes | Ejecuta el archivo 2 (paso 2.4). |

## Cómo se protege la votación

- El voto solo se guarda después de verificar el código, y el correo se toma de esa verificación, no de lo que la persona escriba.
- La base de datos no acepta dos votos del mismo correo.
- Los votos, los correos y la lista de administradores no se pueden leer desde el sitio público. Solo las funciones del panel los muestran, y únicamente a administradores.
- Un administrador no puede quitarse a sí mismo, así que siempre queda al menos uno.
- Límite honesto: alguien con muchos correos reales podría votar varias veces, una por correo. Para un proyecto personal es el equilibrio adecuado.

## Archivos

```
index.html           Página de votación
admin.html           Panel de administración
privacidad.html      Aviso de privacidad
config.js            Configuración (lo único que necesitas editar)
css/estilos.css      Diseño (colores, tipografías Figtree y Google Sans)
img/logo.webp        Logotipo
js/                  Lógica de las páginas
supabase/            Archivos SQL para la base de datos (pasos 2.3 a 2.5)
plantillas/          Ejemplos de CSV para cambiar de personajes
scripts/             Script que generó el catálogo de Pokémon desde PokéAPI
```

---

Proyecto personal sin fines de lucro. Pokémon y los nombres de sus personajes son marcas de Nintendo, Game Freak y The Pokémon Company. Datos e imágenes de [PokéAPI](https://pokeapi.co).
