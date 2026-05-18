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
router.get('/:email', async (req, res) => {
  try {
    const records = await query(`
      MATCH (u:Usuario {email: $email})
      OPTIONAL MATCH (u)-[c:CALIFICÓ]->(p:Pelicula)
      RETURN u, count(c) AS totalCalificaciones, avg(c.puntuacion) AS promedio
    `, { email: req.params.email });

    if (records.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const u = records[0].get('u').properties;
    res.json({
      email: u.email, nombre: u.nombre, pais: u.pais,
      totalCalificaciones: toNum(records[0].get('totalCalificaciones')),
      promedio: Math.round(toNum(records[0].get('promedio')) * 10) / 10 || null,
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

// POST /api/users/:email/calificar/:movieId — calificar una película
router.post('/:email/calificar/:movieId', async (req, res) => {
  const { puntuacion, resena, contieneSpoiler } = req.body;
  if (!puntuacion || puntuacion < 1 || puntuacion > 10) {
    return res.status(400).json({ error: 'puntuacion debe estar entre 1 y 10' });
  }
  try {
    await query(`
      MATCH (u:Usuario {email: $email}), (p:Pelicula {id: $movieId})
      MERGE (u)-[r:CALIFICÓ]->(p)
      SET r.puntuacion = $puntuacion,
          r.fecha = $fecha,
          r.resena = $resena,
          r.contieneSpoiler = $contieneSpoiler,
          r.likes = coalesce(r.likes, 0)
    `, {
      email: req.params.email,
      movieId: req.params.movieId,
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

// DELETE /api/users/:email/calificar/:movieId — eliminar calificación
router.delete('/:email/calificar/:movieId', async (req, res) => {
  try {
    await query(
      'MATCH (u:Usuario {email: $email})-[r:CALIFICÓ]->(p:Pelicula {id: $movieId}) DELETE r',
      { email: req.params.email, movieId: req.params.movieId }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:email/calificaciones — historial de calificaciones
router.get('/:email/calificaciones', async (req, res) => {
  try {
    const records = await query(`
      MATCH (u:Usuario {email: $email})-[c:CALIFICÓ]->(p:Pelicula)
      OPTIONAL MATCH (p)-[:PERTENECE_A]->(g:Genero)
      RETURN p, c, collect(g.nombre) AS generos
      ORDER BY c.fecha DESC
    `, { email: req.params.email });

    res.json(records.map(r => {
      const p = r.get('p').properties;
      const c = r.get('c').properties;
      return {
        pelicula: {
          id: p.id, titulo: p.titulo, anio: toNum(p.anio),
          duracion: toNum(p.duracion), imagen: p.imagen,
          generos: r.get('generos') || [],
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

export default router;
