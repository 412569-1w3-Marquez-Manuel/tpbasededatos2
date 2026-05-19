import React, { useState } from 'react';
import { Star, X, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { api } from '../api.js';

export default function RatingModal({ item, currentEmail, onClose, onSuccess }) {
  const [puntuacion, setPuntuacion] = useState(0);
  const [hover, setHover] = useState(0);
  const [resena, setResena] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (puntuacion < 1 || puntuacion > 10) { setError('Seleccioná una puntuación entre 1 y 10'); return; }
    setLoading(true);
    try {
      await api.calificar(currentEmail, item.id, {
        puntuacion,
        resena: resena.trim(),
        contieneSpoiler: spoiler,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const active = hover || puntuacion;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Star size={20} className="text-yellow-400" /> Calificar
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Info del contenido */}
          <div className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
            {item.imagen && <img src={item.imagen} alt={item.titulo} className="w-12 h-16 rounded-lg object-cover" />}
            <div>
              <p className="text-white font-bold">{item.titulo}</p>
              <p className="text-gray-400 text-sm">{item.tipo} · {item.anio}</p>
            </div>
          </div>

          {/* Estrellas / Puntuación */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Puntuación: <span className="text-yellow-400 font-bold text-lg">{active > 0 ? active : '—'}/10</span>
            </label>
            <div className="flex gap-1 flex-wrap">
              {stars.map(n => (
                <button key={n} type="button"
                  onClick={() => setPuntuacion(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  className={`w-9 h-9 rounded-lg font-bold text-sm transition-all ${n <= active ? 'bg-yellow-500 text-black scale-105' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Reseña */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Reseña (opcional)</label>
            <textarea value={resena} onChange={e => setResena(e.target.value)}
              placeholder="¿Qué te pareció?"
              rows={3}
              className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm" />
          </div>

          {/* Spoiler toggle */}
          <button type="button" onClick={() => setSpoiler(p => !p)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${spoiler ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-gray-300'}`}>
            {spoiler ? <AlertTriangle size={16} /> : <EyeOff size={16} />}
            {spoiler ? 'Contiene spoilers' : 'Sin spoilers'}
          </button>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{error}</p>}

          <button type="submit" disabled={loading || puntuacion === 0}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Star size={18} fill="currentColor" />}
            {loading ? 'Guardando...' : 'Guardar calificación'}
          </button>
        </form>
      </div>
    </div>
  );
}
