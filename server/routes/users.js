import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

function toNum(v) {
  return v && typeof v.toNumber === 'function' ? v.toNumber() : v;
}

// GET /api/users — todos los usuarios
router.get('/', async (req, res) => {
  try {
    const records = await query('MATCH (u:Usuario) RETURN u ORDER BY u.nombre');
    res.json(records.map(r => {
      const u = r.get('u').properties;
      return { email: u.email, nombre: u.nombre, pais: u.pais };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:email — perfil de un usuario
// IMPORTANTE: rutas específicas deben ir ANTES de /:email para evitar conflictos
router.get('/:email', async (req, res) => {
  try {
    const records = await query(`
      MATCH (u:Usuario {email: $email})
      OPTIONAL MATCH (u)-[c:CALIFICÓ]->(contenido)
      WHERE contenido:Pelicula OR contenido:Serie
      WITH u, count(c) AS totalCalificaciones, avg(c.puntuacion) AS promedio
      OPTIONAL MATCH (u)-[:ES_AMIGO_DE]->(amigo:Usuario)
      RETURN u, totalCalificaciones, promedio, count(DISTINCT amigo) AS totalAmigos
    `, { email: req.params.email });

    if (records.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const u = records[0].get('u').properties;
    const prom = toNum(records[0].get('promedio'));
    res.json({
      email: u.email, nombre: u.nombre, pais: u.pais,
      totalCalificaciones: toNum(records[0].get('totalCalificaciones')),
      totalAmigos: toNum(records[0].get('totalAmigos')),
      promedio: prom ? Math.round(prom * 10) / 10 : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:email — actualizar perfil
router.put('/:email', async (req, res) => {
  const { nombre, pais } = req.body;
  try {
    await query(
      'MATCH (u:Usuario {email: $email}) SET u.nombre = $nombre, u.pais = $pais',
      { email: req.params.email, nombre, pais }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:email/calificar/:id — calificar una película o serie
router.post('/:email/calificar/:id', async (req, res) => {
  const { puntuacion, resena, contieneSpoiler } = req.body;
  if (!puntuacion || puntuacion < 1 || puntuacion > 10) {
    return res.status(400).json({ error: 'puntuacion debe estar entre 1 y 10' });
  }
  try {
    await query(`
      MATCH (u:Usuario {email: $email})
      MATCH (c) WHERE c.id = $id AND (c:Pelicula OR c:Serie)
      MERGE (u)-[r:CALIFICÓ]->(c)
      SET r.puntuacion = $puntuacion,
          r.fecha = $fecha,
          r.resena = $resena,
          r.contieneSpoiler = $contieneSpoiler,
          r.likes = coalesce(r.likes, 0)
    `, {
      email: req.params.email,
      id: req.params.id,
      puntuacion,
      fecha: new Date().toISOString().split('T')[0],
      resena: resena || '',
      contieneSpoiler: contieneSpoiler || false,
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:email/calificar/:id — eliminar calificación de película o serie
router.delete('/:email/calificar/:id', async (req, res) => {
  try {
    await query(`
      MATCH (u:Usuario {email: $email})-[r:CALIFICÓ]->(c)
      WHERE c.id = $id
      DELETE r
    `, { email: req.params.email, id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:email/calificaciones — historial de calificaciones (películas y series)
router.get('/:email/calificaciones', async (req, res) => {
  try {
    const records = await query(`
      MATCH (u:Usuario {email: $email})-[c:CALIFICÓ]->(contenido)
      WHERE contenido:Pelicula OR contenido:Serie
      OPTIONAL MATCH (contenido)-[:PERTENECE_A]->(g:Genero)
      RETURN contenido, c, collect(g.nombre) AS generos
      ORDER BY c.fecha DESC
    `, { email: req.params.email });

    res.json(records.map(r => {
      const node = r.get('contenido');
      const p = node.properties;
      const c = r.get('c').properties;
      const esSerie = node.labels.includes('Serie');
      return {
        contenido: {
          id: p.id, titulo: p.titulo, anio: toNum(p.anio),
          imagen: p.imagen, tipo: esSerie ? 'Serie' : 'Película',
          generos: r.get('generos') || [],
          ...(esSerie
            ? { temporadas: toNum(p.temporadas), duracion: toNum(p.duracion) }
            : { duracion: toNum(p.duracion) }),
        },
        puntuacion: toNum(c.puntuacion),
        fecha: c.fecha,
        resena: c.resena,
        contieneSpoiler: c.contieneSpoiler,
        likes: toNum(c.likes),
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: mapea un nodo Pelicula o Serie a objeto plano
function mapContenido(node) {
  const p = node.properties;
  const esSerie = node.labels.includes('Serie');
  return {
    id: p.id,
    titulo: p.titulo,
    anio: toNum(p.anio),
    imagen: p.imagen || null,
    tipo: esSerie ? 'Serie' : 'Película',
    ...(esSerie
      ? { temporadas: toNum(p.temporadas), duracion: toNum(p.duracion) }
      : { duracion: toNum(p.duracion) }),
  };
}

// POST /api/users/:email/like/:id — dar me gusta (Pelicula o Serie)
router.post('/:email/like/:id', async (req, res) => {
  const { email, id } = req.params;
  try {
    await query(`
      MATCH (u:Usuario {email: $email})
      MATCH (c) WHERE c.id = $id AND (c:Pelicula OR c:Serie)
      MERGE (u)-[:LE_GUSTÓ]->(c)
    `, { email, id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:email/like/:id — quitar me gusta
router.delete('/:email/like/:id', async (req, res) => {
  const { email, id } = req.params;
  try {
    await query(`
      MATCH (u:Usuario {email: $email})-[r:LE_GUSTÓ]->(c)
      WHERE c.id = $id
      DELETE r
    `, { email, id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:email/likes — contenido al que le dio me gusta
router.get('/:email/likes', async (req, res) => {
  try {
    const records = await query(`
      MATCH (u:Usuario {email: $email})-[:LE_GUSTÓ]->(c)
      WHERE c:Pelicula OR c:Serie
      RETURN c
      ORDER BY c.titulo
    `, { email: req.params.email });
    res.json(records.map(r => mapContenido(r.get('c'))));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:email/guardar/:id — guardar para ver más tarde
router.post('/:email/guardar/:id', async (req, res) => {
  const { email, id } = req.params;
  try {
    await query(`
      MATCH (u:Usuario {email: $email})
      MATCH (c) WHERE c.id = $id AND (c:Pelicula OR c:Serie)
      MERGE (u)-[:GUARDÓ]->(c)
    `, { email, id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:email/guardar/:id — quitar de guardados
router.delete('/:email/guardar/:id', async (req, res) => {
  const { email, id } = req.params;
  try {
    await query(`
      MATCH (u:Usuario {email: $email})-[r:GUARDÓ]->(c)
      WHERE c.id = $id
      DELETE r
    `, { email, id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:email/guardados — lista de ver más tarde
router.get('/:email/guardados', async (req, res) => {
  try {
    const records = await query(`
      MATCH (u:Usuario {email: $email})-[:GUARDÓ]->(c)
      WHERE c:Pelicula OR c:Serie
      RETURN c
      ORDER BY c.titulo
    `, { email: req.params.email });
    res.json(records.map(r => mapContenido(r.get('c'))));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:email/amigos/:friendEmail — agregar amistad
router.post('/:email/amigos/:friendEmail', async (req, res) => {
  const { email, friendEmail } = req.params;
  try {
    await query(`
      MATCH (a:Usuario {email: $email}), (b:Usuario {email: $friendEmail})
      MERGE (a)-[:ES_AMIGO_DE {desde: $desde}]->(b)
      MERGE (b)-[:ES_AMIGO_DE {desde: $desde}]->(a)
    `, { email, friendEmail, desde: new Date().toISOString().split('T')[0] });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:email/amigos — lista de amigos
router.get('/:email/amigos', async (req, res) => {
  try {
    const records = await query(`
      MATCH (u:Usuario {email: $email})-[r:ES_AMIGO_DE]->(amigo:Usuario)
      RETURN amigo, r.desde AS desde
      ORDER BY amigo.nombre
    `, { email: req.params.email });

    res.json(records.map(r => {
      const a = r.get('amigo').properties;
      return { email: a.email, nombre: a.nombre, pais: a.pais, desde: r.get('desde') };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/users/:email/amigos/:friendEmail — eliminar amistad
router.delete('/:email/amigos/:friendEmail', async (req, res) => {
  const { email, friendEmail } = req.params;
  try {
    await query(`
      MATCH (a:Usuario {email: $email})-[r:ES_AMIGO_DE]-(b:Usuario {email: $friendEmail})
      DELETE r
    `, { email, friendEmail });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// GET /api/users/:email/afinidad/:friendEmail
// Score de compatibilidad cinematográfica (0–100%)
//
// METODOLOGÍA (defendible en exposición oral):
//
// El score se compone de 4 dimensiones, cada una calculada con recorridos
// reales del grafo Neo4j:
//
// 1. CONTENIDO COMÚN (peso 40%): Jaccard similarity sobre conjuntos de
//    contenido calificado. Mide qué fracción del catálogo visto por ambos
//    fue visto en común. Evita inflar el score por volumen.
//
// 2. SIMILITUD DE PUNTUACIONES (peso 30%): Para el contenido en común,
//    calcula 1 - (|diff| / 10) promediado. Si puntúan igual → 1, si opuesto → 0.
//    Captura no solo "vieron lo mismo" sino "les gustó igual".
//
// 3. GÉNEROS EN COMÚN (peso 20%): Jaccard sobre géneros de contenido calificado.
//    Mide compatibilidad de gustos más allá de títulos específicos.
//
// 4. DIRECTORES EN COMÚN (peso 10%): Directores de contenido que ambos calificaron.
//    Indica afinidad estética profunda (estilo visual, narrativo).
//
// Normalización: cada dimensión → [0, 1], luego suma ponderada → * 100.
// ════════════════════════════════════════════════════════════════════════════
router.get('/:email/afinidad/:friendEmail', async (req, res) => {
  const { email, friendEmail } = req.params;

  // Edge case: mismo usuario
  if (email === friendEmail) {
    return res.json({
      user: email, friend: friendEmail,
      afinidad: 100,
      categoria: 'Gemelos Cinematográficos',
      stats: { contenidoComun: 0, generosComun: 0, directoresComun: 0 },
    });
  }

  try {
    // ── QUERY 1: contenido común + similitud de puntuaciones ──────────────
    // Recorre el grafo: Usuario→[CALIFICÓ]→Contenido←[CALIFICÓ]←Usuario
    // Calcula Jaccard para contenido y diferencia promedio de puntuaciones
    const commonRecords = await query(`
      MATCH (u1:Usuario {email: $e1})-[r1:CALIFICÓ]->(c)<-[r2:CALIFICÓ]-(u2:Usuario {email: $e2})
      WHERE c:Pelicula OR c:Serie
      WITH count(DISTINCT c)          AS contenidoComun,
           avg(abs(r1.puntuacion - r2.puntuacion)) AS diffPromedio
      RETURN contenidoComun, diffPromedio
    `, { e1: email, e2: friendEmail });

    // ── QUERY 2: totales individuales para Jaccard ────────────────────────
    // Necesitamos |A ∪ B| = |A| + |B| - |A ∩ B|
    const totalesRecords = await query(`
      MATCH (u1:Usuario {email: $e1})-[:CALIFICÓ]->(c1)
      WHERE c1:Pelicula OR c1:Serie
      WITH count(DISTINCT c1) AS total1
      MATCH (u2:Usuario {email: $e2})-[:CALIFICÓ]->(c2)
      WHERE c2:Pelicula OR c2:Serie
      RETURN total1, count(DISTINCT c2) AS total2
    `, { e1: email, e2: friendEmail });

    // ── QUERY 3: géneros en común (Jaccard) ───────────────────────────────
    // Recorre: Usuario→CALIFICÓ→Contenido→PERTENECE_A→Genero
    // Géneros del u1 que también aparecen en contenido calificado por u2
    const generoRecords = await query(`
      MATCH (u1:Usuario {email: $e1})-[:CALIFICÓ]->(c1)-[:PERTENECE_A]->(g:Genero)
      WHERE c1:Pelicula OR c1:Serie
      WITH u1, collect(DISTINCT g.nombre) AS generos1
      MATCH (u2:Usuario {email: $e2})-[:CALIFICÓ]->(c2)-[:PERTENECE_A]->(g2:Genero)
      WHERE c2:Pelicula OR c2:Serie
      WITH generos1, collect(DISTINCT g2.nombre) AS generos2
      WITH [g IN generos1 WHERE g IN generos2] AS interseccion,
           generos1, generos2
      WITH size(interseccion)                              AS generosComun,
           size(generos1) + size(generos2) - size(interseccion) AS union
      RETURN generosComun, union AS totalGeneros
    `, { e1: email, e2: friendEmail });

    // ── QUERY 4: directores en común ──────────────────────────────────────
    // Recorre: Usuario→CALIFICÓ→Contenido←DIRIGIÓ←Director→DIRIGIÓ→Contenido←CALIFICÓ←Usuario
    // Directores cuyas obras fueron vistas por ambos usuarios
    const directorRecords = await query(`
      MATCH (u1:Usuario {email: $e1})-[:CALIFICÓ]->(c1)<-[:DIRIGIÓ]-(d:Director)-[:DIRIGIÓ]->(c2)<-[:CALIFICÓ]-(u2:Usuario {email: $e2})
      WHERE (c1:Pelicula OR c1:Serie) AND (c2:Pelicula OR c2:Serie)
      WITH count(DISTINCT d) AS directoresComun
      RETURN directoresComun
    `, { e1: email, e2: friendEmail });

    // ── Extraer valores ───────────────────────────────────────────────────
    const contenidoComun  = toNum(commonRecords[0]?.get('contenidoComun'))  || 0;
    const diffPromedio    = toNum(commonRecords[0]?.get('diffPromedio'))    || 0;
    const total1          = toNum(totalesRecords[0]?.get('total1'))         || 0;
    const total2          = toNum(totalesRecords[0]?.get('total2'))         || 0;
    const generosComun    = toNum(generoRecords[0]?.get('generosComun'))    || 0;
    const totalGeneros    = toNum(generoRecords[0]?.get('totalGeneros'))    || 0;
    const directoresComun = toNum(directorRecords[0]?.get('directoresComun')) || 0;

    // ── Edge cases: sin calificaciones ───────────────────────────────────
    if (total1 === 0 || total2 === 0) {
      return res.json({
        user: email, friend: friendEmail,
        afinidad: 0,
        categoria: 'Sin datos suficientes',
        stats: { contenidoComun: 0, generosComun: 0, directoresComun: 0 },
      });
    }

    // ── Dimensión 1: Jaccard de contenido [0, 1] ─────────────────────────
    // Jaccard = |A ∩ B| / |A ∪ B|
    const unionContenido = total1 + total2 - contenidoComun;
    const jaccardContenido = unionContenido > 0 ? contenidoComun / unionContenido : 0;

    // ── Dimensión 2: similitud de puntuaciones [0, 1] ─────────────────────
    // Si no hay contenido en común → 0. Si diffPromedio=0 → 1. Si diff=10 → 0.
    const simPuntuaciones = contenidoComun > 0 ? Math.max(0, 1 - diffPromedio / 10) : 0;

    // ── Dimensión 3: Jaccard de géneros [0, 1] ────────────────────────────
    const jaccardGeneros = totalGeneros > 0 ? generosComun / totalGeneros : 0;

    // ── Dimensión 4: directores comunes normalizados [0, 1] ───────────────
    // Normalizamos contra el máximo razonable (10 directores) para no saturar
    const maxDirectores = Math.max(Math.min(total1, total2), 1); // al menos 1
    const simDirectores = Math.min(1, directoresComun / Math.min(maxDirectores, 10));

    // ── Score ponderado → porcentaje ──────────────────────────────────────
    const scoreFinal = (
      jaccardContenido  * 0.40 +
      simPuntuaciones   * 0.30 +
      jaccardGeneros    * 0.20 +
      simDirectores     * 0.10
    );

    const porcentaje = Math.round(scoreFinal * 100);

    // ── Categoría descriptiva ─────────────────────────────────────────────
    let categoria;
    if (porcentaje >= 80)      categoria = 'Gemelos Cinematográficos';
    else if (porcentaje >= 60) categoria = 'Gran Afinidad';
    else if (porcentaje >= 40) categoria = 'Gustos Compatibles';
    else if (porcentaje >= 20) categoria = 'Algo en Común';
    else                       categoria = 'Gustos Distintos';

    res.json({
      user:    email,
      friend:  friendEmail,
      afinidad: porcentaje,
      categoria,
      stats: {
        contenidoComun,
        generosComun,
        directoresComun,
      },
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
