import { Router } from 'express';
import { query } from '../db.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { nombre, email, pais, password } = req.body;
  if (!nombre?.trim() || !email || !password) {
    return res.status(400).json({ error: 'nombre, email y password son requeridos' });
  }
  try {
    const existing = await query('MATCH (u:Usuario {email: $email}) RETURN u', { email });
    if (existing.length > 0) return res.status(409).json({ error: 'El email ya está registrado' });

    await query(
      'CREATE (u:Usuario {nombre: $nombre, email: $email, pais: $pais, password: $password})',
      { nombre: nombre.trim(), email, pais: pais || '', password }
    );
    res.json({ email, nombre: nombre.trim(), pais: pais || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const records = await query(
      'MATCH (u:Usuario {email: $email, password: $password}) RETURN u',
      { email, password }
    );
    if (records.length === 0) return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    const u = records[0].get('u').properties;
    res.json({ email: u.email, nombre: u.nombre, pais: u.pais });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
