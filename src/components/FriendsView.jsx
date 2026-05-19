import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Search, X } from 'lucide-react';
import { api } from '../api.js';

function AffinityBadge({ score }) {
  if (score === null || score === undefined) return <span className="text-gray-500 text-xs">Calculando...</span>;
  const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
  const cls = {
    green: 'bg-green-500/20 border-green-500/40 text-green-400',
    yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
    red: 'bg-red-500/20 border-red-500/40 text-red-400',
  }[color];
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {score}% afinidad
    </span>
  );
}

export default function FriendsView({ currentEmail }) {
  const [amigos, setAmigos] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [afinidades, setAfinidades] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    load();
  }, [currentEmail]);

  async function load() {
    setLoading(true);
    try {
      const [friendList, users] = await Promise.all([
        api.getAmigos(currentEmail),
        api.getAllUsers(),
      ]);
      setAmigos(friendList);
      setAllUsers(users.filter(u => u.email !== currentEmail));
      // Cargar afinidades en background
      friendList.forEach(async (f) => {
        try {
          const af = await api.getAfinidad(currentEmail, f.email);
          setAfinidades(prev => ({ ...prev, [f.email]: af.afinidad }));
        } catch {}
      });
    } catch (err) {
      setError('Error al cargar amigos: ' + err.message);
    } finally { setLoading(false); }
  }

  async function addFriend(friendEmail) {
    setAddLoading(friendEmail);
    try {
      await api.agregarAmigo(currentEmail, friendEmail);
      setMsg('¡Amigo agregado!');
      await load();
    } catch (err) {
      setError(err.message);
    } finally { setAddLoading(''); setTimeout(() => setMsg(''), 2000); }
  }

  async function removeFriend(friendEmail) {
    try {
      await api.eliminarAmigo(currentEmail, friendEmail);
      setMsg('Amigo eliminado');
      await load();
    } catch (err) {
      setError(err.message);
    } finally { setTimeout(() => setMsg(''), 2000); }
  }

  const friendEmails = new Set(amigos.map(a => a.email));
  const filtered = allUsers.filter(u =>
    !friendEmails.has(u.email) &&
    (u.nombre?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Users className="text-blue-500" size={32} /> Amigos
        </h1>
        <p className="text-gray-400">{amigos.length} amigos en tu red</p>
      </div>

      {error && <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 flex items-center justify-between"><span>{error}</span><button onClick={() => setError('')}><X size={16}/></button></div>}
      {msg && <div className="mb-4 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">{msg}</div>}

      {/* Lista de amigos */}
      {amigos.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-3">Tus amigos</h2>
          <div className="space-y-3">
            {amigos.map(a => (
              <div key={a.email} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {(a.nombre || a.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{a.nombre || a.email}</p>
                    <p className="text-gray-500 text-xs">{a.email}</p>
                    {a.pais && <p className="text-gray-600 text-xs">{a.pais}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AffinityBadge score={afinidades[a.email]} />
                  <button onClick={() => removeFriend(a.email)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <UserMinus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buscar usuarios */}
      <div>
        <h2 className="text-lg font-semibold text-gray-300 mb-3">Agregar amigos</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-2.5 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
        </div>
        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            {allUsers.length === 0 ? 'No hay otros usuarios registrados' : 'No se encontraron usuarios'}
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filtered.slice(0, 20).map(u => (
              <div key={u.email} className="bg-gray-900/40 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                    {(u.nombre || u.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{u.nombre || u.email}</p>
                    <p className="text-gray-500 text-xs">{u.email}</p>
                  </div>
                </div>
                <button onClick={() => addFriend(u.email)} disabled={addLoading === u.email}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-xs font-medium disabled:opacity-50">
                  {addLoading === u.email ? <span className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> : <UserPlus size={13} />}
                  Agregar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
