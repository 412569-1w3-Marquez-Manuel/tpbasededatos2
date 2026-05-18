import { query, driver } from './db.js';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.TMDB_API_KEY;
const ACTORES_POR_TITULO = 5;
const DELAY_MS = 150;

async function tmdb(path) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${BASE_URL}${path}${sep}api_key=${API_KEY}&language=es-AR`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Géneros ──────────────────────────────────────────────────────────────────

async function sincronizarGeneros() {
  const [movGen, tvGen] = await Promise.all([
    tmdb('/genre/movie/list'),
    tmdb('/genre/tv/list'),
  ]);
  const todos = [...movGen.genres, ...tvGen.genres];
  const unicos = [...new Map(todos.map(g => [g.id, g])).values()];
  for (const g of unicos) {
    await query('MERGE (:Genero {nombre: $nombre})', { nombre: g.name });
  }
  console.log(`✓ ${unicos.length} géneros sincronizados`);
  return Object.fromEntries(unicos.map(g => [g.id, g.name]));
}

// ─── Helpers comunes ──────────────────────────────────────────────────────────

async function guardarPersona(label, nombre) {
  await query(`MERGE (x:${label} {nombre: $nombre}) ON CREATE SET x.nacionalidad = ""`, { nombre });
}

async function guardarRelacionGenero(id, label, genreNames) {
  for (const nombre of genreNames) {
    await query(
      `MATCH (x:${label} {id: $id}), (g:Genero {nombre: $nombre}) MERGE (x)-[:PERTENECE_A]->(g)`,
      { id, nombre }
    );
  }
}

// ─── Películas ────────────────────────────────────────────────────────────────

async function importarPelicula(movieId) {
  const [det, cred] = await Promise.all([
    tmdb(`/movie/${movieId}`),
    tmdb(`/movie/${movieId}/credits`),
  ]);
  await sleep(DELAY_MS);

  const id = 'tmdb_' + movieId;
  const titulo = det.title;
  const anio = det.release_date ? parseInt(det.release_date.slice(0, 4)) : null;
  const duracion = det.runtime || null;
  const imagen = det.poster_path ? `${IMAGE_BASE}${det.poster_path}` : null;

  await query(
    'MERGE (p:Pelicula {id: $id}) SET p.titulo = $titulo, p.anio = $anio, p.duracion = $duracion, p.imagen = $imagen',
    { id, titulo, anio, duracion, imagen }
  );
  await guardarRelacionGenero(id, 'Pelicula', det.genres.map(g => g.name));

  for (const dir of cred.crew.filter(c => c.job === 'Director')) {
    await guardarPersona('Director', dir.name);
    await query(
      'MATCH (p:Pelicula {id: $id}), (d:Director {nombre: $nombre}) MERGE (d)-[:DIRIGIÓ]->(p)',
      { id, nombre: dir.name }
    );
  }
  for (const actor of cred.cast.slice(0, ACTORES_POR_TITULO)) {
    await guardarPersona('Actor', actor.name);
    await query(
      'MATCH (p:Pelicula {id: $id}), (a:Actor {nombre: $nombre}) MERGE (a)-[:ACTUÓ_EN {personaje: $personaje}]->(p)',
      { id, nombre: actor.name, personaje: actor.character || '' }
    );
  }
  return titulo;
}

async function completarPeliculas(objetivo = 100) {
  const r = await query('MATCH (p:Pelicula) RETURN count(p) AS total');
  let actual = r[0].get('total').toNumber();

  if (actual >= objetivo) {
    console.log(`✓ Ya hay ${actual} películas, no se necesitan más\n`);
    return;
  }

  const faltantes = objetivo - actual;
  console.log(`Películas actuales: ${actual}. Faltan ${faltantes} para llegar a ${objetivo}...\n`);

  // IDs ya importados
  const existentes = await query('MATCH (p:Pelicula) RETURN p.id AS id');
  const idsExistentes = new Set(existentes.map(r => r.get('id')));

  let importadas = 0;
  let pagina = 6; // las páginas 1-5 ya fueron importadas

  while (importadas < faltantes) {
    const data = await tmdb(`/movie/top_rated?page=${pagina}`);
    await sleep(DELAY_MS);
    pagina++;

    for (const movie of data.results) {
      if (importadas >= faltantes) break;
      const id = 'tmdb_' + movie.id;
      if (idsExistentes.has(id)) continue;
      try {
        const titulo = await importarPelicula(movie.id);
        importadas++;
        console.log(`  [+${importadas}/${faltantes}] ${titulo}`);
      } catch (err) {
        console.log(`  Error película ${movie.id}: ${err.message}`);
      }
    }

    if (pagina > 20) break; // tope de seguridad
  }

  console.log(`\n✓ Películas completadas a ${actual + importadas}\n`);
}

// ─── Series ───────────────────────────────────────────────────────────────────

async function importarSerie(serieId) {
  const [det, cred] = await Promise.all([
    tmdb(`/tv/${serieId}`),
    tmdb(`/tv/${serieId}/credits`),
  ]);
  await sleep(DELAY_MS);

  const id = 'tv_' + serieId;
  const titulo = det.name;
  const anio = det.first_air_date ? parseInt(det.first_air_date.slice(0, 4)) : null;
  const temporadas = det.number_of_seasons || null;
  const duracion = det.episode_run_time?.[0] || null; // duración en minutos por episodio
  const imagen = det.poster_path ? `${IMAGE_BASE}${det.poster_path}` : null;

  await query(
    `MERGE (s:Serie {id: $id})
     SET s.titulo = $titulo, s.anio = $anio, s.temporadas = $temporadas,
         s.duracion = $duracion, s.imagen = $imagen`,
    { id, titulo, anio, temporadas, duracion, imagen }
  );
  await guardarRelacionGenero(id, 'Serie', det.genres.map(g => g.name));

  // Creadores como directores
  for (const creador of (det.created_by || [])) {
    await guardarPersona('Director', creador.name);
    await query(
      'MATCH (s:Serie {id: $id}), (d:Director {nombre: $nombre}) MERGE (d)-[:DIRIGIÓ]->(s)',
      { id, nombre: creador.name }
    );
  }
  for (const actor of cred.cast.slice(0, ACTORES_POR_TITULO)) {
    await guardarPersona('Actor', actor.name);
    await query(
      'MATCH (s:Serie {id: $id}), (a:Actor {nombre: $nombre}) MERGE (a)-[:ACTUÓ_EN {personaje: $personaje}]->(s)',
      { id, nombre: actor.name, personaje: actor.character || '' }
    );
  }
  return titulo;
}

async function importarSeries(objetivo = 100) {
  const r = await query('MATCH (s:Serie) RETURN count(s) AS total');
  let actual = r[0].get('total').toNumber();

  if (actual >= objetivo) {
    console.log(`✓ Ya hay ${actual} series\n`);
    return;
  }

  const faltantes = objetivo - actual;
  console.log(`Importando ${faltantes} series desde TMDB...\n`);

  const idsExistentes = new Set(
    (await query('MATCH (s:Serie) RETURN s.id AS id')).map(r => r.get('id'))
  );

  const serieIds = new Set();
  for (let page = 1; serieIds.size < objetivo + 20 && page <= 10; page++) {
    const data = await tmdb(`/tv/top_rated?page=${page}`);
    data.results.forEach(s => serieIds.add(s.id));
    await sleep(DELAY_MS);
  }

  let ok = 0, errores = 0;
  const ids = [...serieIds];
  for (let i = 0; i < ids.length && ok < faltantes; i++) {
    const id = 'tv_' + ids[i];
    if (idsExistentes.has(id)) continue;
    try {
      const titulo = await importarSerie(ids[i]);
      ok++;
      process.stdout.write(`\r  [${ok}/${faltantes}] ${titulo.slice(0, 55).padEnd(55)}`);
    } catch (err) {
      errores++;
    }
  }

  console.log(`\n\n✓ ${ok} series importadas${errores > 0 ? `, ${errores} errores` : ''}\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error('Falta TMDB_API_KEY en el .env');
    process.exit(1);
  }

  const limpiar = process.argv.includes('--limpiar');

  console.log('=== Importación desde TMDB ===\n');

  if (limpiar) {
    await query('MATCH (p:Pelicula) DETACH DELETE p');
    await query('MATCH (s:Serie) DETACH DELETE s');
    await query('MATCH (a:Actor) WHERE NOT (a)-[:ACTUÓ_EN]->() DELETE a');
    await query('MATCH (d:Director) WHERE NOT (d)-[:DIRIGIÓ]->() DELETE d');
    await query('MATCH (g:Genero) WHERE NOT ()-[:PERTENECE_A]->(g) DELETE g');
    console.log('✓ Datos anteriores eliminados\n');
  }

  await sincronizarGeneros();
  console.log('');
  await completarPeliculas(100);
  await importarSeries(100);

  // Stats finales
  const stats = await query(`
    MATCH (p:Pelicula) WITH count(p) AS pel
    MATCH (s:Serie)    WITH pel, count(s) AS ser
    MATCH (a:Actor)    WITH pel, ser, count(a) AS act
    MATCH (d:Director) WITH pel, ser, act, count(d) AS dir
    MATCH (g:Genero)   RETURN pel, ser, act, dir, count(g) AS gen
  `);
  const s = stats[0];
  console.log('Base de datos final:');
  console.log(`  Películas:  ${s.get('pel')}`);
  console.log(`  Series:     ${s.get('ser')}`);
  console.log(`  Actores:    ${s.get('act')}`);
  console.log(`  Directores: ${s.get('dir')}`);
  console.log(`  Géneros:    ${s.get('gen')}`);

  await driver.close();
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
