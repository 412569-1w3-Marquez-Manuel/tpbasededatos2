import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

function toNum(v) {
  return v && typeof v.toNumber === 'function' ? v.toNumber() : v;
}

// GET /api/recommendations/:email
// Películas que calificaron bien los amigos y el usuario aún no vio
router.get('/:email', async (req, res) => {
  try {
    const records = await query(`
      MATCH (yo:Usuario {email: $email})-[:ES_AMIGO_DE]->(amigo:Usuario)-[c:CALIFICÓ]->(p:Pelicula)
      WHERE NOT (yo)-[:CALIFICÓ]->(p) AND c.puntuacion >= 7
      WITH p, amigo, c
      ORDER BY c.puntuacion DESC
      OPTIONAL MATCH (p)-[:PERTENECE_A]->(g:Genero)
      OPTIONAL MATCH (d:Director)-[:DIRIGIÓ]->(p)
      RETURN p,
             collect(DISTINCT g.nombre) AS generos,
             d.nombre                   AS director,
             amigo.nombre               AS recomienda,
             c.puntuacion               AS puntuacion,
             c.resena                   AS resena
      ORDER BY c.puntuacion DESC
      LIMIT 20
    `, { email: req.params.email });

    res.json(records.map(r => {
      const p = r.get('p').properties;
      return {
        pelicula: {
          id: p.id, titulo: p.titulo, anio: toNum(p.anio),
          duracion: toNum(p.duracion), imagen: p.imagen,
          generos: r.get('generos') || [],
          director: r.get('director') || null,
        },
        recomienda: r.get('recomienda'),
        puntuacion: toNum(r.get('puntuacion')),
        resena: r.get('resena'),
      };
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
