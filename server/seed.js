import { query, driver } from './db.js';

// ─── Datos base ───────────────────────────────────────────────────────────────

const generos = [
  'Ciencia Ficción', 'Acción', 'Thriller', 'Drama',
  'Aventura', 'Misterio', 'Comedia', 'Animación', 'Fantasía',
];

const directores = [
  { nombre: 'Christopher Nolan',  nacionalidad: 'Británico-Estadounidense' },
  { nombre: 'Denis Villeneuve',   nacionalidad: 'Canadiense' },
  { nombre: 'Lana Wachowski',     nacionalidad: 'Estadounidense' },
  { nombre: 'Alex Garland',       nacionalidad: 'Británico' },
  { nombre: 'George Miller',      nacionalidad: 'Australiano' },
  { nombre: 'David Fincher',      nacionalidad: 'Estadounidense' },
  { nombre: 'Frank Darabont',     nacionalidad: 'Francés-Estadounidense' },
  { nombre: 'Bong Joon-ho',       nacionalidad: 'Coreano' },
  { nombre: 'Hayao Miyazaki',     nacionalidad: 'Japonés' },
  { nombre: 'Wes Anderson',       nacionalidad: 'Estadounidense' },
  { nombre: 'Chad Stahelski',     nacionalidad: 'Estadounidense' },
  { nombre: 'Bob Persichetti',    nacionalidad: 'Estadounidense' },
];

const actores = [
  { nombre: 'Leonardo DiCaprio',    nacionalidad: 'Estadounidense' },
  { nombre: 'Joseph Gordon-Levitt', nacionalidad: 'Estadounidense' },
  { nombre: 'Keanu Reeves',         nacionalidad: 'Canadiense' },
  { nombre: 'Laurence Fishburne',   nacionalidad: 'Estadounidense' },
  { nombre: 'Matthew McConaughey', nacionalidad: 'Estadounidense' },
  { nombre: 'Anne Hathaway',        nacionalidad: 'Estadounidense' },
  { nombre: 'Ryan Gosling',         nacionalidad: 'Canadiense' },
  { nombre: 'Harrison Ford',        nacionalidad: 'Estadounidense' },
  { nombre: 'Amy Adams',            nacionalidad: 'Estadounidense' },
  { nombre: 'Oscar Isaac',          nacionalidad: 'Estadounidense-Guatemalteco' },
  { nombre: 'Alicia Vikander',      nacionalidad: 'Sueca' },
  { nombre: 'Christian Bale',       nacionalidad: 'Británico' },
  { nombre: 'Heath Ledger',         nacionalidad: 'Australiano' },
  { nombre: 'Tom Hardy',            nacionalidad: 'Británico' },
  { nombre: 'Charlize Theron',      nacionalidad: 'Sudafricana' },
  { nombre: 'Brad Pitt',            nacionalidad: 'Estadounidense' },
  { nombre: 'Morgan Freeman',       nacionalidad: 'Estadounidense' },
  { nombre: 'Tim Robbins',          nacionalidad: 'Estadounidense' },
  { nombre: 'Song Kang-ho',         nacionalidad: 'Coreano' },
  { nombre: 'Shameik Moore',        nacionalidad: 'Estadounidense' },
  { nombre: 'Ralph Fiennes',        nacionalidad: 'Británico' },
];

const peliculas = [
  {
    id: 'm1', titulo: 'Inception', anio: 2010, duracion: 148,
    imagen: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=500&auto=format&fit=crop',
    generos: ['Ciencia Ficción', 'Acción', 'Thriller'],
    director: 'Christopher Nolan',
    actores: [
      { nombre: 'Leonardo DiCaprio',    personaje: 'Dom Cobb' },
      { nombre: 'Joseph Gordon-Levitt', personaje: 'Arthur' },
    ],
  },
  {
    id: 'm2', titulo: 'The Matrix', anio: 1999, duracion: 136,
    imagen: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=500&auto=format&fit=crop',
    generos: ['Ciencia Ficción', 'Acción'],
    director: 'Lana Wachowski',
    actores: [
      { nombre: 'Keanu Reeves',      personaje: 'Neo' },
      { nombre: 'Laurence Fishburne', personaje: 'Morpheus' },
    ],
  },
  {
    id: 'm3', titulo: 'Interstellar', anio: 2014, duracion: 169,
    imagen: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=500&auto=format&fit=crop',
    generos: ['Ciencia Ficción', 'Drama', 'Aventura'],
    director: 'Christopher Nolan',
    actores: [
      { nombre: 'Matthew McConaughey', personaje: 'Cooper' },
      { nombre: 'Anne Hathaway',       personaje: 'Amelia Brand' },
    ],
  },
  {
    id: 'm4', titulo: 'Blade Runner 2049', anio: 2017, duracion: 164,
    imagen: 'https://images.unsplash.com/photo-1610452331577-628a5293231e?q=80&w=500&auto=format&fit=crop',
    generos: ['Ciencia Ficción', 'Drama', 'Misterio'],
    director: 'Denis Villeneuve',
    actores: [
      { nombre: 'Ryan Gosling',   personaje: 'K' },
      { nombre: 'Harrison Ford',  personaje: 'Rick Deckard' },
    ],
  },
  {
    id: 'm5', titulo: 'Arrival', anio: 2016, duracion: 116,
    imagen: 'https://images.unsplash.com/photo-1529126498863-74d1a1ed8a7e?q=80&w=500&auto=format&fit=crop',
    generos: ['Ciencia Ficción', 'Drama', 'Misterio'],
    director: 'Denis Villeneuve',
    actores: [
      { nombre: 'Amy Adams',   personaje: 'Louise Banks' },
    ],
  },
  {
    id: 'm6', titulo: 'Ex Machina', anio: 2015, duracion: 108,
    imagen: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=500&auto=format&fit=crop',
    generos: ['Ciencia Ficción', 'Thriller'],
    director: 'Alex Garland',
    actores: [
      { nombre: 'Oscar Isaac',     personaje: 'Nathan Bateman' },
      { nombre: 'Alicia Vikander', personaje: 'Ava' },
    ],
  },
  {
    id: 'm7', titulo: 'The Dark Knight', anio: 2008, duracion: 152,
    imagen: 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?q=80&w=500&auto=format&fit=crop',
    generos: ['Acción', 'Drama', 'Thriller'],
    director: 'Christopher Nolan',
    actores: [
      { nombre: 'Christian Bale', personaje: 'Bruce Wayne / Batman' },
      { nombre: 'Heath Ledger',   personaje: 'El Joker' },
    ],
  },
  {
    id: 'm8', titulo: 'Mad Max: Fury Road', anio: 2015, duracion: 120,
    imagen: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=500&auto=format&fit=crop',
    generos: ['Acción', 'Ciencia Ficción', 'Aventura'],
    director: 'George Miller',
    actores: [
      { nombre: 'Tom Hardy',       personaje: 'Max Rockatansky' },
      { nombre: 'Charlize Theron', personaje: 'Imperator Furiosa' },
    ],
  },
  {
    id: 'm9', titulo: 'John Wick', anio: 2014, duracion: 101,
    imagen: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?q=80&w=500&auto=format&fit=crop',
    generos: ['Acción', 'Thriller'],
    director: 'Chad Stahelski',
    actores: [
      { nombre: 'Keanu Reeves', personaje: 'John Wick' },
    ],
  },
  {
    id: 'm10', titulo: 'Se7en', anio: 1995, duracion: 127,
    imagen: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=500&auto=format&fit=crop',
    generos: ['Drama', 'Misterio', 'Thriller'],
    director: 'David Fincher',
    actores: [
      { nombre: 'Brad Pitt',     personaje: 'David Mills' },
      { nombre: 'Morgan Freeman', personaje: 'William Somerset' },
    ],
  },
  {
    id: 'm11', titulo: 'The Shawshank Redemption', anio: 1994, duracion: 142,
    imagen: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=500&auto=format&fit=crop',
    generos: ['Drama'],
    director: 'Frank Darabont',
    actores: [
      { nombre: 'Tim Robbins',   personaje: 'Andy Dufresne' },
      { nombre: 'Morgan Freeman', personaje: 'Ellis Boyd "Red" Redding' },
    ],
  },
  {
    id: 'm12', titulo: 'Parasite', anio: 2019, duracion: 132,
    imagen: 'https://images.unsplash.com/photo-1580130775562-0ef92da028de?q=80&w=500&auto=format&fit=crop',
    generos: ['Drama', 'Thriller', 'Comedia'],
    director: 'Bong Joon-ho',
    actores: [
      { nombre: 'Song Kang-ho', personaje: 'Kim Ki-taek' },
    ],
  },
  {
    id: 'm13', titulo: 'Spirited Away', anio: 2001, duracion: 125,
    imagen: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=500&auto=format&fit=crop',
    generos: ['Animación', 'Aventura', 'Fantasía'],
    director: 'Hayao Miyazaki',
    actores: [],
  },
  {
    id: 'm14', titulo: 'Spider-Man: Into the Spider-Verse', anio: 2018, duracion: 117,
    imagen: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=500&auto=format&fit=crop',
    generos: ['Animación', 'Acción', 'Aventura'],
    director: 'Bob Persichetti',
    actores: [
      { nombre: 'Shameik Moore', personaje: 'Miles Morales / Spider-Man' },
    ],
  },
  {
    id: 'm15', titulo: 'The Grand Budapest Hotel', anio: 2014, duracion: 99,
    imagen: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?q=80&w=500&auto=format&fit=crop',
    generos: ['Comedia', 'Drama', 'Aventura'],
    director: 'Wes Anderson',
    actores: [
      { nombre: 'Ralph Fiennes', personaje: 'M. Gustave H.' },
    ],
  },
];

const usuarios = [
  { email: 'tomas@graphrecs.com',  nombre: 'Tomás',  pais: 'Argentina', password: '1234' },
  { email: 'maria@graphrecs.com',  nombre: 'María',  pais: 'España',    password: '1234' },
  { email: 'juan@graphrecs.com',   nombre: 'Juan',   pais: 'México',    password: '1234' },
  { email: 'ana@graphrecs.com',    nombre: 'Ana',    pais: 'Argentina', password: '1234' },
];

// (email_usuario, id_pelicula, puntuacion, fecha, resena, contieneSpoiler, likes)
const calificaciones = [
  ['tomas@graphrecs.com', 'm1', 9,  '2024-01-10', 'Obra maestra del cine moderno. La estructura narrativa es brillante.', false, 15],
  ['tomas@graphrecs.com', 'm2', 10, '2024-01-15', 'La película que cambió el cine de ciencia ficción para siempre.', false, 23],
  ['tomas@graphrecs.com', 'm3', 8,  '2024-02-03', 'Visualmente impresionante, aunque el final se siente apresurado.', false, 8],
  ['maria@graphrecs.com', 'm1', 8,  '2024-01-20', 'Muy buena película, aunque necesita varias vistas para entenderla.', false, 5],
  ['maria@graphrecs.com', 'm12', 10,'2024-03-05', 'El giro final lo cambia todo. Absolutamente imperdible.', true,  12],
  ['maria@graphrecs.com', 'm10', 9, '2024-02-14', 'Una de las mejores películas de suspenso que vi en mi vida.', false, 7],
  ['juan@graphrecs.com',  'm2', 9,  '2024-01-25', 'Clásico eterno. Las escenas de acción siguen siendo increíbles.', false, 3],
  ['juan@graphrecs.com',  'm7', 10, '2024-02-10', 'Heath Ledger como el Joker es el mejor villano de la historia del cine.', false, 18],
  ['juan@graphrecs.com',  'm9', 8,  '2024-03-01', 'Entretenimiento puro. La coreografía de peleas es extraordinaria.', false, 2],
  ['ana@graphrecs.com',   'm13', 10,'2024-01-30', 'La mejor película animada de todos los tiempos, sin discusión.', false, 9],
  ['ana@graphrecs.com',   'm14', 9, '2024-02-20', 'Revolucionó la animación. La dirección de arte es increíble.', false, 6],
  ['ana@graphrecs.com',   'm15', 8, '2024-03-10', 'Wes Anderson en su máximo esplendor. Una joya visual.', false, 4],
];

// [email_a, email_b, desde]
const amistades = [
  ['tomas@graphrecs.com', 'maria@graphrecs.com', '2023-01-15'],
  ['tomas@graphrecs.com', 'juan@graphrecs.com',  '2022-06-20'],
  ['maria@graphrecs.com', 'ana@graphrecs.com',   '2024-03-10'],
  ['juan@graphrecs.com',  'ana@graphrecs.com',   '2023-08-05'],
];

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Iniciando seed...\n');

  // Géneros
  for (const nombre of generos) {
    await query('MERGE (:Genero {nombre: $nombre})', { nombre });
  }
  console.log(`✓ ${generos.length} géneros`);

  // Directores
  for (const d of directores) {
    await query('MERGE (d:Director {nombre: $nombre}) SET d.nacionalidad = $nac', { nombre: d.nombre, nac: d.nacionalidad });
  }
  console.log(`✓ ${directores.length} directores`);

  // Actores
  for (const a of actores) {
    await query('MERGE (a:Actor {nombre: $nombre}) SET a.nacionalidad = $nac', { nombre: a.nombre, nac: a.nacionalidad });
  }
  console.log(`✓ ${actores.length} actores`);

  // Películas + relaciones
  for (const p of peliculas) {
    await query(
      'MERGE (p:Pelicula {id: $id}) SET p.titulo = $titulo, p.anio = $anio, p.duracion = $duracion, p.imagen = $imagen',
      { id: p.id, titulo: p.titulo, anio: p.anio, duracion: p.duracion, imagen: p.imagen }
    );
    for (const g of p.generos) {
      await query(
        'MATCH (p:Pelicula {id: $id}), (g:Genero {nombre: $g}) MERGE (p)-[:PERTENECE_A]->(g)',
        { id: p.id, g }
      );
    }
    await query(
      'MATCH (p:Pelicula {id: $id}), (d:Director {nombre: $dir}) MERGE (d)-[:DIRIGIÓ]->(p)',
      { id: p.id, dir: p.director }
    );
    for (const a of p.actores) {
      await query(
        'MATCH (p:Pelicula {id: $id}), (a:Actor {nombre: $nombre}) MERGE (a)-[:ACTUÓ_EN {personaje: $personaje}]->(p)',
        { id: p.id, nombre: a.nombre, personaje: a.personaje }
      );
    }
  }
  console.log(`✓ ${peliculas.length} películas`);

  // Usuarios de ejemplo
  for (const u of usuarios) {
    await query(
      'MERGE (u:Usuario {email: $email}) SET u.nombre = $nombre, u.pais = $pais, u.password = $password',
      u
    );
  }
  console.log(`✓ ${usuarios.length} usuarios de ejemplo`);

  // Calificaciones
  for (const [email, pelId, puntuacion, fecha, resena, contieneSpoiler, likes] of calificaciones) {
    await query(`
      MATCH (u:Usuario {email: $email}), (p:Pelicula {id: $pelId})
      MERGE (u)-[r:CALIFICÓ]->(p)
      SET r.puntuacion = $puntuacion, r.fecha = $fecha, r.resena = $resena,
          r.contieneSpoiler = $contieneSpoiler, r.likes = $likes
    `, { email, pelId, puntuacion, fecha, resena, contieneSpoiler, likes });
  }
  console.log(`✓ ${calificaciones.length} calificaciones`);

  // Amistades (bidireccionales)
  for (const [emailA, emailB, desde] of amistades) {
    await query(`
      MATCH (a:Usuario {email: $emailA}), (b:Usuario {email: $emailB})
      MERGE (a)-[:ES_AMIGO_DE {desde: $desde}]->(b)
      MERGE (b)-[:ES_AMIGO_DE {desde: $desde}]->(a)
    `, { emailA, emailB, desde });
  }
  console.log(`✓ ${amistades.length} amistades (bidireccionales)`);

  await driver.close();
  console.log('\n✓ Seed completado!');
}

seed().catch(err => {
  console.error(err.message);
  process.exit(1);
});
