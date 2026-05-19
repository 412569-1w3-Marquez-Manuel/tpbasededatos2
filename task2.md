# GraphRecs — Estado Actual Post Integración

## ✅ Backend + Neo4j

- [x] Conexión estable con Neo4j Aura
- [x] Archivo `.env` configurado correctamente
- [x] Constraints inicializados automáticamente
- [x] Backend estable en `localhost:3001`
- [x] CORS corregido para entorno de desarrollo
- [x] API REST funcionando correctamente

---

## ✅ Integración Frontend ↔ Backend

- [x] Integración real mediante `api.js`
- [x] Eliminado gran parte del mock basado en `localStorage`
- [x] Uso de `sessionStorage`
- [x] Frontend conectado a backend real (`localhost:3001`)
- [x] Fetch de películas reales
- [x] Fetch de recomendaciones reales
- [x] FriendsView integrado
- [x] RatingModal integrado
- [x] Sistema de loaders y errores agregado

---

## ✅ Afinidad entre usuarios

- [x] Endpoint `/api/users/:email/afinidad/:friendEmail`
- [x] Consulta Cypher compleja implementada
- [x] Similitud por:
  - contenido en común
  - géneros
  - directores
  - similitud de puntuaciones
- [x] Score normalizado
- [x] Badge visual de afinidad
- [x] Colores de afinidad:
  - verde ≥80
  - amarillo 60–79
  - rojo <60

---

## ✅ Bugs ya corregidos

- [x] Conflictos de rutas Express (`recommended/:email`)
- [x] ORDER BY duplicado en recomendaciones
- [x] Crashes de RecommendationsView
- [x] Crashes del GraphDashboard
- [x] Problemas CORS entre Vite y Express
- [x] Duplicación cartesiana en Cypher
- [x] LIMIT agregado a películas y series
- [x] Runtime crashes principales estabilizados

---

# ⚠️ Pendiente / Problemas restantes

## 🔥 Auth frontend inconsistente

### Problema actual
El backend trabaja con:
- `email`

Pero la UI todavía muestra:
- "Usuario"
- "Nombre de usuario"

Posible mismatch:
- frontend usa `username`
- backend espera `email`

### Revisar
- `src/App.jsx`
- `src/api.js`
- `components/LoginView.jsx`

### El login debería enviar:
```json
{
  "email": "...",
  "password": "..."
}