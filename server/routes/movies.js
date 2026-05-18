import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

function toNum(v) {
  return v && typeof v.toNumber === 'function' ? v.toNumber() : v;
}

function mapPelicula(record) {
  const p = record.get('p').properties;
  return {
    id: p.id,
    titulo: p.titulo,
    anio: toNum(p.anio),
    duracion: toNum(p.duracion),
    imagen: p.imagen || null,
    generos: record.get('generos') || [],
    director: record.get('director') || null,
    actores: record.get('actores') || [],
  };
}

// GET /api/movies — todas las películas
router.get('/', async (req, res) => {
  try {
    const records = await query(`
      MATCH (p:Pelicula)
      OPTIONAL MATCH (p)-[:PERTENECE_A]->(g:Genero)
      OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(p)
      OPTIONAL MATCH (a:Actor)-[act:ACTUÓ_EN]->(p)
      RETURN p,
             collect(DISTINCT g.nombre)             AS generos,
             d.nombre                               AS director,
             collect(DISTINCT {nombre: a.nombre, personaje: act.personaje}) AS actores
      ORDER BY p.anio DESC
    `);
    res.json(records.map(mapPelicula));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id — detalle de una película
router.get('/:id', async (req, res) => {
  try {
    const records = await query(`
      MATCH (p:Pelicula {id: $id})
      OPTIONAL MATCH (p)-[:PERTENECE_A]->(g:Genero)
      OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(p)
      OPTIONAL MATCH (a:Actor)-[act:ACTUÓ_EN]->(p)
      OPTIONAL MATCH (u:Usuario)-[c:CALIFICÓ]->(p)
      RETURN p,
             collect(DISTINCT g.nombre)             AS generos,
             d.nombre                               AS director,
             collect(DISTINCT {nombre: a.nombre, personaje: act.personaje}) AS actores,
             avg(c.puntuacion)                      AS promedio,
             count(c)                               AS totalCalificaciones
    `, { id: req.params.id });

    if (records.length === 0) return res.status(404).json({ error: 'Película no encontrada' });

    const record = records[0];
    const prom = record.get('promedio');
    const total = record.get('totalCalificaciones');

    res.json({
      ...mapPelicula(record),
      promedio: prom ? Math.round(toNum(prom) * 10) / 10 : null,
      totalCalificaciones: toNum(total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/recommended/:email — películas recomendadas según amigos
router.get('/recommended/:email', async (req, res) => {
  try {
    // Películas bien calificadas por amigos que el usuario no vio
    let records = await query(`
      MATCH (yo:Usuario {email: $email})-[:ES_AMIGO_DE]->(amigo:Usuario)-[c:CALIFICÓ]->(p:Pelicula)
      WHERE NOT (yo)-[:CALIFICÓ]->(p) AND c.puntuacion >= 7
      WITH p, avg(c.puntuacion) AS promAmigos, count(c) AS votosAmigos
      ORDER BY promAmigos DESC, votosAmigos DESC
      LIMIT 10
      OPTIONAL MATCH (p)-[:PERTENECE_A]->(g:Genero)
      OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(p)
      OPTIONAL MATCH (a:Actor)-[act:ACTUÓ_EN]->(p)
      RETURN p,
             collect(DISTINCT g.nombre) AS generos,
             d.nombre                   AS director,
             collect(DISTINCT {nombre: a.nombre, personaje: act.personaje}) AS actores,
             promAmigos, votosAmigos
    `, { email: req.params.email });

    // Fallback: las más calificadas globalmente
    if (records.length === 0) {
      records = await query(`
        MATCH (u:Usuario)-[c:CALIFICÓ]->(p:Pelicula)
        WITH p, avg(c.puntuacion) AS promAmigos, count(c) AS votosAmigos
        ORDER BY promAmigos DESC, votosAmigos DESC
        LIMIT 10
        OPTIONAL MATCH (p)-[:PERTENECE_A]->(g:Genero)
        OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(p)
        OPTIONAL MATCH (a:Actor)-[act:ACTUÓ_EN]->(p)
        RETURN p,
               collect(DISTINCT g.nombre) AS generos,
               d.nombre                   AS director,
               collect(DISTINCT {nombre: a.nombre, personaje: act.personaje}) AS actores,
               promAmigos, votosAmigos
      `);
    }

    res.json(records.map(record => ({
      ...mapPelicula(record),
      promAmigos: Math.round(toNum(record.get('promAmigos')) * 10) / 10,
      votosAmigos: toNum(record.get('votosAmigos')),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
