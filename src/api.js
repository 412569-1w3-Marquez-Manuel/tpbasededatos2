const BASE = 'http://localhost:3001/api';

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => http('POST', '/auth/login', { email, password }),
  register: (nombre, email, pais, password) => http('POST', '/auth/register', { nombre, email, pais, password }),

  // Users
  getUser: (email) => http('GET', `/users/${encodeURIComponent(email)}`),
  updateUser: (email, nombre, pais) => http('PUT', `/users/${encodeURIComponent(email)}`, { nombre, pais }),

  // Películas
  getMovies: () => http('GET', '/movies'),
  getMovie: (id) => http('GET', `/movies/${id}`),
  getMoviesRecommended: (email) => http('GET', `/movies/recommended/${encodeURIComponent(email)}`),

  // Series
  getSeries: () => http('GET', '/series'),
  getSerie: (id) => http('GET', `/series/${id}`),
  getSeriesRecommended: (email) => http('GET', `/series/recommended/${encodeURIComponent(email)}`),

  // Recomendaciones de amigos
  getRecommendations: (email) => http('GET', `/recommendations/${encodeURIComponent(email)}`),

  // Calificaciones
  calificar: (email, id, data) => http('POST', `/users/${encodeURIComponent(email)}/calificar/${id}`, data),
  getCalificaciones: (email) => http('GET', `/users/${encodeURIComponent(email)}/calificaciones`),

  // Guardados
  guardar: (email, id) => http('POST', `/users/${encodeURIComponent(email)}/guardar/${id}`),
  quitarGuardado: (email, id) => http('DELETE', `/users/${encodeURIComponent(email)}/guardar/${id}`),
  getGuardados: (email) => http('GET', `/users/${encodeURIComponent(email)}/guardados`),

  // Likes
  like: (email, id) => http('POST', `/users/${encodeURIComponent(email)}/like/${id}`),
  quitarLike: (email, id) => http('DELETE', `/users/${encodeURIComponent(email)}/like/${id}`),
  getLikes: (email) => http('GET', `/users/${encodeURIComponent(email)}/likes`),

  // Amigos
  getAmigos: (email) => http('GET', `/users/${encodeURIComponent(email)}/amigos`),
  agregarAmigo: (email, friendEmail) => http('POST', `/users/${encodeURIComponent(email)}/amigos/${encodeURIComponent(friendEmail)}`),
  eliminarAmigo: (email, friendEmail) => http('DELETE', `/users/${encodeURIComponent(email)}/amigos/${encodeURIComponent(friendEmail)}`),

  // Afinidad
  getAfinidad: (email, friendEmail) => http('GET', `/users/${encodeURIComponent(email)}/afinidad/${encodeURIComponent(friendEmail)}`),

  // Todos los usuarios (para agregar amigos)
  getAllUsers: () => http('GET', '/users'),
};

// Session helpers (sessionStorage)
export const session = {
  get: () => {
    try { return JSON.parse(sessionStorage.getItem('grecs_user')); } catch { return null; }
  },
  set: (user) => sessionStorage.setItem('grecs_user', JSON.stringify(user)),
  clear: () => sessionStorage.removeItem('grecs_user'),
};
