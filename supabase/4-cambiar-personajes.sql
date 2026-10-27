-- =====================================================================
--  CAMBIAR A OTROS PERSONAJES (ver README, sección "Cambiar a otros personajes")
-- =====================================================================

-- PARTE 1: borra TODOS los votos, personajes y grupos actuales.
-- Cuidado: no se puede deshacer. Descarga antes el CSV del ranking si lo quieres guardar.
truncate public.votos;
delete from public.personajes;
delete from public.grupos;

-- PARTE 2 (opcional): si prefieres escribirlos aquí en vez de importar CSV,
-- borra los guiones del inicio de estas líneas, cámbialas y ejecútalas.
-- insert into public.grupos (id, nombre, subtitulo, orden) values
--   (1, 'Temporada 1', '2019', 1),
--   (2, 'Temporada 2', '2021', 2);
--
-- insert into public.personajes (grupo_id, nombre, imagen_url, numero) values
--   (1, 'Personaje A', 'https://ejemplo.com/a.png', 1),
--   (1, 'Personaje B', 'https://ejemplo.com/b.png', 2),
--   (2, 'Personaje C', 'img/personaje-c.png', 3);
