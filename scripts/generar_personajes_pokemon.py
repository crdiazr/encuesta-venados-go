"""
Genera supabase/2-personajes-pokemon.sql a partir de los datos oficiales de PokéAPI.

Los datos vienen del repositorio público de PokéAPI (el mismo que alimenta https://pokeapi.co)
y las imágenes son el "official artwork" que sirve PokéAPI.

No necesitas correr esto: el archivo SQL ya viene generado. Solo sirve si en el futuro
salen Pokémon nuevos y quieres regenerarlo:  python3 scripts/generar_personajes_pokemon.py
"""
import csv
import io
import pathlib
import urllib.request

BASE = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/"
IMAGEN = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png"
ESPANOL, INGLES = 7, 9
REGIONES = {1: "Kanto", 2: "Johto", 3: "Hoenn", 4: "Sinnoh", 5: "Teselia",
            6: "Kalos", 7: "Alola", 8: "Galar", 9: "Paldea"}


def leer(nombre, carpeta_local=None):
    if carpeta_local:
        texto = (pathlib.Path(carpeta_local) / f"{nombre}.csv").read_text(encoding="utf-8")
    else:
        with urllib.request.urlopen(BASE + nombre + ".csv") as r:
            texto = r.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(texto)))


def sql(texto):
    return "'" + texto.replace("'", "''") + "'"


def main(carpeta_local=None):
    generaciones = {int(g["generation_id"]): g["name"] for g in leer("generation_names", carpeta_local)
                    if int(g["local_language_id"]) == ESPANOL}
    nombres = {int(n["pokemon_species_id"]): n["name"] for n in leer("pokemon_species_names", carpeta_local)
               if int(n["local_language_id"]) == INGLES}
    especies = sorted(leer("pokemon_species", carpeta_local), key=lambda e: int(e["id"]))

    lineas = [
        "-- Catálogo de Pokémon (generado desde PokéAPI). Pégalo en el SQL Editor de Supabase DESPUÉS de 1-estructura.sql.",
        "-- Se puede ejecutar más de una vez: actualiza lo que ya exista.",
        "",
        "insert into public.grupos (id, nombre, subtitulo, orden) values",
    ]
    filas = [f"  ({g}, {sql(generaciones[g])}, {sql(REGIONES.get(g, ''))}, {g})" for g in sorted(generaciones)
             if any(int(e['generation_id']) == g for e in especies)]
    lineas.append(",\n".join(filas))
    lineas.append("on conflict (id) do update set nombre = excluded.nombre, subtitulo = excluded.subtitulo, orden = excluded.orden;")
    lineas += ["", "insert into public.personajes (id, grupo_id, nombre, imagen_url, numero) overriding system value values"]
    filas = []
    for e in especies:
        i = int(e["id"])
        filas.append(f"  ({i}, {int(e['generation_id'])}, {sql(nombres.get(i, e['identifier'].title()))}, {sql(IMAGEN.format(id=i))}, {i})")
    lineas.append(",\n".join(filas))
    lineas.append("on conflict (id) do update set grupo_id = excluded.grupo_id, nombre = excluded.nombre,"
                  " imagen_url = excluded.imagen_url, numero = excluded.numero;")
    lineas += ["", "-- Mantiene el contador de ids en orden por si después agregas personajes a mano.",
               "select setval(pg_get_serial_sequence('public.personajes', 'id'), (select max(id) from public.personajes));", ""]

    destino = pathlib.Path(__file__).resolve().parent.parent / "supabase" / "2-personajes-pokemon.sql"
    destino.write_text("\n".join(lineas), encoding="utf-8")
    print(f"Listo: {len(especies)} personajes en {len(set(e["generation_id"] for e in especies))} generaciones -> {destino}")


if __name__ == "__main__":
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else None)
