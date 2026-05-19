import express from 'express';
import cors from 'cors';
import { driver, query } from './db.js';
import authRouter from './routes/auth.js';
import moviesRouter from './routes/movies.js';
import usersRouter from './routes/users.js';
import recsRouter from './routes/recommendations.js';
import seriesRouter from './routes/series.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/movies', moviesRouter);
app.use('/api/series', seriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/recommendations', recsRouter);

async function initConstraints() {
  await query('CREATE CONSTRAINT usuario_email IF NOT EXISTS FOR (u:Usuario) REQUIRE u.email IS UNIQUE');
  await query('CREATE CONSTRAINT pelicula_id  IF NOT EXISTS FOR (p:Pelicula)  REQUIRE p.id IS UNIQUE');
  await query('CREATE CONSTRAINT actor_nombre  IF NOT EXISTS FOR (a:Actor)     REQUIRE a.nombre IS UNIQUE');
  await query('CREATE CONSTRAINT director_nombre IF NOT EXISTS FOR (d:Director) REQUIRE d.nombre IS UNIQUE');
  await query('CREATE CONSTRAINT genero_nombre IF NOT EXISTS FOR (g:Genero)   REQUIRE g.nombre IS UNIQUE');
  await query('CREATE CONSTRAINT serie_id     IF NOT EXISTS FOR (s:Serie)     REQUIRE s.id IS UNIQUE');
}

async function start() {
  try {
    await driver.verifyConnectivity();
    console.log('✓ Conectado a Neo4j Aura');
    await initConstraints();
    console.log('✓ Constraints inicializados');
    app.listen(3001, () => console.log('✓ Servidor en http://localhost:3001'));
  } catch (err) {
    console.error('Error al iniciar:', err.message);
    process.exit(1);
  }
}

start();
