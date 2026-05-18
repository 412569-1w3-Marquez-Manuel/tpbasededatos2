import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

function toNum(v) {
  return v && typeof v.toNumber === 'function' ? v.toNumber() : v;
}

function mapSerie(record) {
  const s = record.get('s').properties;
  return {
    id: s.id,
    titulo: s.titulo,
    anio: toNum(s.anio),
    temporadas: toNum(s.temporadas),
    duracion: toNum(s.duracion),
    imagen: s.imagen || null,
    generos: record.get('generos') || [],
    creador: record.get('creador') || null,
    actores: record.get('actores') || [],
  };
}

// GET /api/series — todas las series
router.get('/', async (req, res) => {
  try {
    const records = await query(`
      MATCH (s:Serie)
      OPTIONAL MATCH (s)-[:PERTENECE_A]->(g:Genero)
      OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(s)
      OPTIONAL MATCH (a:Actor)-[act:ACTUÓ_EN]->(s)
      RETURN s,
             collect(DISTINCT g.nombre)                                        AS generos,
             d.nombre                                                           AS creador,
             collect(DISTINCT {nombre: a.nombre, personaje: act.personaje})    AS actores
      ORDER BY s.anio DESC
    `);
    res.json(records.map(mapSerie));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/series/:id — detalle de una serie
router.get('/:id', async (req, res) => {
  try {
    const records = await query(`
      MATCH (s:Serie {id: $id})
      OPTIONAL MATCH (s)-[:PERTENECE_A]->(g:Genero)
      OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(s)
      OPTIONAL MATCH (a:Actor)-[act:ACTUÓ_EN]->(s)
      OPTIONAL MATCH (u:Usuario)-[c:CALIFICÓ]->(s)
      RETURN s,
             collect(DISTINCT g.nombre)                                        AS generos,
             d.nombre                                                           AS creador,
             collect(DISTINCT {nombre: a.nombre, personaje: act.personaje})    AS actores,
             avg(c.puntuacion)                                                  AS promedio,
             count(c)                                                           AS totalCalificaciones
    `, { id: req.params.id });

    if (records.length === 0) return res.status(404).json({ error: 'Serie no encontrada' });

    const record = records[0];
    const prom = record.get('promedio');
    const total = record.get('totalCalificaciones');

    res.json({
      ...mapSerie(record),
      promedio: prom ? Math.round(toNum(prom) * 10) / 10 : null,
      totalCalificaciones: toNum(total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/series/recommended/:email — series recomendadas según amigos
router.get('/recommended/:email', async (req, res) => {
  try {
    // Series bien calificadas por amigos que el usuario no vio
    let records = await query(`
      MATCH (yo:Usuario {email: $email})-[:ES_AMIGO_DE]->(amigo:Usuario)-[c:CALIFICÓ]->(s:Serie)
      WHERE NOT (yo)-[:CALIFICÓ]->(s) AND c.puntuacion >= 7
      WITH s, avg(c.puntuacion) AS promAmigos, count(c) AS votosAmigos
      ORDER BY promAmigos DESC, votosAmigos DESC
      LIMIT 10
      OPTIONAL MATCH (s)-[:PERTENECE_A]->(g:Genero)
      OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(s)
      OPTIONAL MATCH (a:Actor)-[act:ACTUÓ_EN]->(s)
      RETURN s,
             collect(DISTINCT g.nombre)                                        AS generos,
             d.nombre                                                           AS creador,
             collect(DISTINCT {nombre: a.nombre, personaje: act.personaje})    AS actores,
             promAmigos, votosAmigos
    `, { email: req.params.email });

    // Fallback: las más calificadas globalmente
    if (records.length === 0) {
      records = await query(`
        MATCH (u:Usuario)-[c:CALIFICÓ]->(s:Serie)
        WITH s, avg(c.puntuacion) AS promAmigos, count(c) AS votosAmigos
        ORDER BY promAmigos DESC, votosAmigos DESC
        LIMIT 10
        OPTIONAL MATCH (s)-[:PERTENECE_A]->(g:Genero)
        OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(s)
        OPTIONAL MATCH (a:Actor)-[act:ACTUÓ_EN]->(s)
        RETURN s,
               collect(DISTINCT g.nombre)                                        AS generos,
               d.nombre                                                           AS creador,
               collect(DISTINCT {nombre: a.nombre, personaje: act.personaje})    AS actores,
               promAmigos, votosAmigos
      `);
    }

    res.json(records.map(record => ({
      ...mapSerie(record),
      promAmigos: Math.round(toNum(record.get('promAmigos')) * 10) / 10,
      votosAmigos: toNum(record.get('votosAmigos')),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
