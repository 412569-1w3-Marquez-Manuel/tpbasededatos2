import React, { useState } from 'react';
import { Lock, Network, User, Mail, Globe } from 'lucide-react';
import { api, session } from '../api.js';

export default function LoginView({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ nombre: '', email: '', pais: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email y contraseña requeridos'); return; }
    setLoading(true);
    try {
      const user = await api.login(form.email.trim().toLowerCase(), form.password);
      session.set(user);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email || !form.password) { setError('Nombre, email y contraseña son requeridos'); return; }
    if (form.password.length < 4) { setError('La contraseña debe tener al menos 4 caracteres'); return; }
    setLoading(true);
    try {
      const user = await api.register(form.nombre.trim(), form.email.trim().toLowerCase(), form.pais, form.password);
      session.set(user);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent pointer-events-none" />
      <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20" />
      <div className="absolute w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20" />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4">
            <Network className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">GraphRecs</h1>
          <p className="text-gray-400 mt-2">Motor de recomendación por grafos</p>
        </div>
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex mb-6 gap-2">
            <button onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${mode === 'login' ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'text-gray-500 hover:text-gray-300'}`}>
              Iniciar Sesión
            </button>
            <button onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${mode === 'register' ? 'bg-green-500/20 border border-green-500/40 text-green-300' : 'text-gray-500 hover:text-gray-300'}`}>
              Registrarse
            </button>
          </div>
          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2"><User size={14} /> Nombre completo</label>
                <input type="text" value={form.nombre} onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Federico Navarrete"
                  className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2"><Mail size={14} /> Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2"><Globe size={14} /> País (opcional)</label>
                <input type="text" value={form.pais} onChange={e => set('pais', e.target.value)}
                  placeholder="Argentina"
                  className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center gap-2"><Lock size={14} /> Contraseña</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${mode === 'login' ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/20' : 'bg-gradient-to-r from-green-500 to-blue-600 shadow-green-500/20'} text-white hover:opacity-90 disabled:opacity-50`}>
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={18} />}
              {loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
