# GraphRecs — Control de Avance

## Base de Datos (Neo4j Aura)

- [x] Definir modelo de grafo (nodos y relaciones)
- [x] Crear instancia en Neo4j Aura Free
- [x] Configurar credenciales en `.env`
- [x] Crear constraints de unicidad para cada nodo
- [x] Script de seed con datos de ejemplo
  - [x] 15 películas
  - [x] 9 géneros
  - [x] 12 directores
  - [x] 21 actores
  - [x] 4 usuarios de ejemplo
  - [x] 12 calificaciones con todos los atributos (`puntuacion`, `fecha`, `resena`, `contieneSpoiler`, `likes`)
  - [x] 4 amistades bidireccionales (`ES_AMIGO_DE`)

---

## Backend (Node.js + Express)

- [x] Configurar servidor Express en `server/`
- [x] Conexión al driver de Neo4j
- [x] Inicialización automática de constraints al arrancar

### Rutas implementadas

#### Autenticación (`/api/auth`)
- [x] `POST /register` — crear usuario
- [x] `POST /login` — autenticar usuario

#### Películas (`/api/movies`)
- [x] `GET /` — listar todas las películas con géneros, director y actores
- [x] `GET /:id` — detalle de una película con promedio de calificaciones
- [x] `GET /recommended/:email` — recomendaciones basadas en calificaciones de amigos (filtrado colaborativo por grafo)

#### Usuarios (`/api/users`)
- [x] `GET /` — listar todos los usuarios
- [x] `GET /:email` — perfil de un usuario con stats
- [x] `PUT /:email` — actualizar nombre y país
- [x] `POST /:email/calificar/:movieId` — calificar una película
- [x] `DELETE /:email/calificar/:movieId` — eliminar calificación
- [x] `GET /:email/calificaciones` — historial de calificaciones
- [x] `GET /:email/amigos` — lista de amigos
- [x] `POST /:email/amigos/:friendEmail` — agregar amistad
- [ ] `GET /:email/afinidad/:friendEmail` — score de compatibilidad cinematográfica

#### Recomendaciones (`/api/recommendations`)
- [x] `GET /:email` — películas bien calificadas por amigos que el usuario no vio

---

## Frontend (React + Vite)

> **Estado actual:** la UI usa `localStorage` como mock. Toda la integración con la API real está pendiente.

### Autenticación
- [ ] Conectar login con `POST /api/auth/login`
- [ ] Conectar registro con `POST /api/auth/register`
- [ ] Reemplazar sesión en `localStorage` por email del usuario autenticado

### Pantalla principal (Home)
- [ ] Cargar películas desde `GET /api/movies`
- [ ] Cargar recomendaciones personalizadas desde `GET /api/movies/recommended/:email`

### Calificaciones
- [ ] Implementar UI para calificar (puntuación 1–10, reseña, spoiler)
- [ ] Conectar con `POST /api/users/:email/calificar/:movieId`
- [ ] Mostrar historial de calificaciones desde `GET /api/users/:email/calificaciones`

### Amigos
- [ ] Mostrar lista de amigos desde `GET /api/users/:email/amigos`
- [ ] Agregar amigo con `POST /api/users/:email/amigos/:friendEmail`

### Recomendaciones de amigos
- [ ] Mostrar películas recomendadas por amigos desde `GET /api/recommendations/:email`

### Perfil
- [ ] Cargar y actualizar datos reales del usuario

---

## Funcionalidades Especiales

### Afinidad entre usuarios
- [ ] **Endpoint:** `GET /api/users/:email/afinidad/:friendEmail`
- [ ] **Consulta Cypher base** (películas en común):
  ```cypher
  MATCH (u1:Usuario {nombre: 'Ana García'})-[:CALIFICÓ]->(p:Pelicula)<-[:CALIFICÓ]-(u2:Usuario {nombre: 'Lucas Pérez'})
  RETURN u1.nombre, u2.nombre, count(p) AS peliculas_en_común
  ```
- [ ] **Score extendido** — combinar tres dimensiones:
  - Películas calificadas en común (peso mayor)
  - Géneros favoritos en común
  - Directores en común
  ```cypher
  MATCH (u1:Usuario {email: $e1})-[:CALIFICÓ]->(p:Pelicula)<-[:CALIFICÓ]-(u2:Usuario {email: $e2})
  WITH u1, u2, count(p) AS peliculas_comun

  MATCH (u1)-[:CALIFICÓ]->(:Pelicula)-[:PERTENECE_A]->(g:Genero)<-[:PERTENECE_A]-(:Pelicula)<-[:CALIFICÓ]-(u2)
  WITH u1, u2, peliculas_comun, count(DISTINCT g) AS generos_comun

  MATCH (u1)-[:CALIFICÓ]->(:Pelicula)<-[:DIRIGIÓ]-(d:Director)-[:DIRIGIÓ]->(:Pelicula)<-[:CALIFICÓ]-(u2)
  WITH u1, u2, peliculas_comun, generos_comun, count(DISTINCT d) AS directores_comun

  RETURN peliculas_comun, generos_comun, directores_comun
  ```
- [ ] Normalizar score a porcentaje (0–100%)
- [ ] **UI:** mostrar badge de afinidad en el perfil de amigos ("87% de afinidad con Lucas")

---

## Pendiente / Ideas futuras

- [ ] Agregar más películas al seed (actualmente 15)
- [ ] Agregar campo `imagen` externo (ej: TMDB API) para posters reales
- [ ] Paginación en el listado de películas
- [ ] Filtro por género en el frontend
- [ ] Buscar usuarios por nombre para agregar como amigos
