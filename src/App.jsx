import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api, session } from './api.js';
import FriendsView from './components/FriendsView.jsx';
import RatingModal from './components/RatingModal.jsx';
import {
    Home,
    Search,
    User,
    Activity,
    Share2,
    Play,
    Plus,
    ThumbsUp,
    Database,
    Network,
    ChevronRight,
    ChevronLeft,
    X,
    LogOut,
    Lock,
    Bookmark,
    Heart,
    Send,
    Camera,
    Save,
    Pencil,
    Users,
    Star
} from 'lucide-react';

// mockContent removed — using real API data

const avatarOptions = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599566150163-29194dcabd9c?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=150&auto=format&fit=crop',
];

// DB mock removed — using api.js

const timeAgo = (iso) => {
    const now = new Date();
    const then = new Date(iso);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 3600) return `Hace ${Math.max(diff / 60, 1)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
};

const NeonBadge = ({ children, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
        green: 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
        pink: 'bg-pink-500/10 text-pink-400 border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${colors[color]}`}>
            {children}
        </span>
    );
};

const ContentCard = ({ item, onClick, onAddToList, onLike, onRecommend, inMyList, isLiked }) => (
    <div
        className="group relative flex-none w-48 md:w-56 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:scale-105 z-10 hover:z-20"
        onClick={() => onClick(item)}
    >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
        <div className="relative aspect-[2/3] md:aspect-square lg:aspect-[2/3] rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-xl">
            <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="absolute top-2 left-2 flex gap-1">
                {item.match && (
                    <NeonBadge color="green">{item.match}% Afinidad</NeonBadge>
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <h3 className="text-white font-bold text-lg truncate drop-shadow-md">{item.title}</h3>
                <p className="text-gray-300 text-sm truncate">{item.artist || item.year}</p>

                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <button className="bg-white text-black p-2 rounded-full hover:bg-gray-200 hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); }}>
                        <Play size={16} fill="currentColor" />
                    </button>
                    <button
                        className={`p-2 rounded-full hover:scale-110 transition-transform ${inMyList ? 'bg-blue-500 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={(e) => { e.stopPropagation(); onAddToList?.(item); }}
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        className={`p-2 rounded-full hover:scale-110 transition-transform ${isLiked ? 'bg-pink-500 text-white' : 'text-gray-300 hover:text-white'}`}
                        onClick={(e) => { e.stopPropagation(); onLike?.(item); }}
                    >
                        <ThumbsUp size={14} fill={isLiked ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        className="p-2 rounded-full text-gray-300 hover:text-purple-400 hover:scale-110 transition-transform"
                        onClick={(e) => { e.stopPropagation(); onRecommend?.(item); }}
                    >
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const Carousel = ({ title, items, subtitle, icon: Icon, onCardClick, onAddToList, onLike, onRecommend, myListIds, likedIds }) => {
    const scrollRef = React.useRef(null);
    const scroll = (direction) => {
        const { current } = scrollRef;
        if (current) {
            const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
    return (
        <div className="mb-10 w-full">
            <div className="flex items-end justify-between mb-4 px-2">
                <div>
                    {subtitle && <p className="text-blue-400 text-sm font-medium mb-1 tracking-wider uppercase flex items-center gap-2"><Icon size={14} /> {subtitle}</p>}
                    <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => scroll('left')} className="p-1 rounded-full bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 backdrop-blur-sm border border-gray-700 transition-all">
                        <ChevronLeft size={24} />
                    </button>
                    <button onClick={() => scroll('right')} className="p-1 rounded-full bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 backdrop-blur-sm border border-gray-700 transition-all">
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>
            <div ref={scrollRef} className="flex gap-4 md:gap-6 overflow-x-auto pb-6 px-2 hide-scrollbar snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {items.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="snap-start">
                        <ContentCard item={item} onClick={onCardClick} onAddToList={onAddToList} onLike={onLike} onRecommend={onRecommend} inMyList={myListIds.has(item.id)} isLiked={likedIds.has(item.id)} />
                    </div>
                ))}
                {items.map((item, idx) => (
                    <div key={`dup-${item.id}-${idx}`} className="snap-start">
                        <ContentCard item={item} onClick={onCardClick} onAddToList={onAddToList} onLike={onLike} onRecommend={onRecommend} inMyList={myListIds.has(item.id)} isLiked={likedIds.has(item.id)} />
                    </div>
                ))}
            </div>
        </div>
    );
};

const DetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="relative h-64 md:h-96 w-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10"></div>
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover opacity-60" />
                    <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all">
                        <X size={24} />
                    </button>
                    <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                        <div className="flex items-center gap-3 mb-3">
                            <NeonBadge color="green">{item.match}% Afinidad en Grafo</NeonBadge>
                            <NeonBadge color="blue">{item.type}</NeonBadge>
                            <span className="text-gray-300 text-sm">{item.year}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 drop-shadow-lg">{item.title}</h1>
                        {item.artist && <h2 className="text-2xl text-gray-300 mb-4">{item.artist}</h2>}
                        <div className="flex items-center gap-4 mt-6">
                            <button className="flex items-center justify-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 hover:scale-105 transition-all">
                                <Play fill="currentColor" size={20} /> Reproducir
                            </button>
                            <button className="p-3 border border-gray-500 rounded-full text-white hover:border-white hover:bg-white/10 transition-all">
                                <Plus size={20} />
                            </button>
                            <button className="p-3 border border-gray-500 rounded-full text-white hover:border-white hover:bg-white/10 transition-all">
                                <ThumbsUp size={20} />
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Acerca de</h3>
                            <p className="text-gray-300 leading-relaxed text-lg">{item.description || `Basado en tu historial con la categoría '${item.genres[0]}' y la similitud con otros usuarios de tu clúster, este contenido es altamente recomendado para ti.`}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-3">Lógica de Recomendación por Grafo</h3>
                            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-gray-300"><Network size={18} className="text-blue-400" /><span>Conectado vía <strong className="text-white">Clúster de Género '{item.genres[0]}'</strong></span></div>
                                <div className="flex items-center gap-3 text-gray-300"><User size={18} className="text-purple-400" /><span>34 usuarios similares también interactuaron con esto</span></div>
                                <div className="flex items-center gap-3 text-gray-300"><Share2 size={18} className="text-green-400" /><span>Camino más corto: Tú &rarr; Nodo '{item.genres[0]}' &rarr; {item.title}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Géneros</h3>
                            <div className="flex flex-wrap gap-2">{item.genres.map(g => (<span key={g} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm border border-gray-700 hover:border-gray-500 cursor-pointer transition-colors">{g}</span>))}</div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Métricas de Grafo</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm"><span className="text-gray-400">Centralidad del Nodo</span><span className="text-white">Alta (0.84)</span></div>
                                <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '84%' }}></div></div>
                                <div className="flex justify-between text-sm mt-3"><span className="text-gray-400">Peso de Conexiones</span><span className="text-white">Fuerte</span></div>
                                <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '92%' }}></div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GraphDashboard = () => (
    <div className="animate-in fade-in duration-500">
        <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3"><Database className="text-blue-500" size={36} /> Grafo de Conocimiento Neo4j</h1>
            <p className="text-gray-400">Métricas en tiempo real del motor de recomendación</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
            {[{ label: 'Nodos Totales', value: '4.502', color: 'blue' }, { label: 'Relaciones', value: '12.894', color: 'purple' }, { label: 'Latencia Promedio', value: '42ms', color: 'green' }, { label: 'Clústeres Activos', value: '18', color: 'pink' }].map((stat, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 relative overflow-hidden group hover:border-gray-700 transition-colors">
                    <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-500/10 rounded-full blur-2xl group-hover:bg-${stat.color}-500/20 transition-all`}></div>
                    <p className="text-gray-400 text-sm font-medium mb-1 relative z-10">{stat.label}</p>
                    <p className="text-3xl font-bold text-white relative z-10">{stat.value}</p>
                </div>
            ))}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-[500px] flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 z-10"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Network size={20} /> Topología Usuario-Contenido</h3><NeonBadge color="blue">Consulta Cypher Activa</NeonBadge></div>
            <div className="flex-1 relative bg-black/40 rounded-xl border border-gray-800 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-500 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.6)] flex items-center justify-center z-20 cursor-pointer hover:scale-110 transition-transform"><User className="text-white" size={24} /></div>
                {[{ top: '20%', left: '30%', color: 'purple', icon: Play, label: 'Inception' }, { top: '70%', left: '25%', color: 'green', icon: User, label: 'Usuario_492' }, { top: '30%', left: '70%', color: 'pink', icon: Database, label: 'Ciencia Ficción' }, { top: '80%', left: '65%', color: 'purple', icon: Play, label: 'Starboy' }].map((node, i) => (
                    <React.Fragment key={i}>
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0"><line x1="50%" y1="50%" x2={node.left} y2={node.top} stroke="rgba(75, 85, 99, 0.4)" strokeWidth="2" strokeDasharray="4" /></svg>
                        <div className={`absolute w-12 h-12 bg-${node.color}-500/20 border-2 border-${node.color}-500/50 rounded-full flex items-center justify-center z-10 cursor-pointer hover:bg-${node.color}-500/40 hover:scale-110 transition-all`} style={{ top: node.top, left: node.left, transform: 'translate(-50%, -50%)' }}><node.icon className={`text-${node.color}-400`} size={16} /><span className="absolute -bottom-6 text-xs text-gray-400 whitespace-nowrap">{node.label}</span></div>
                    </React.Fragment>
                ))}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.8)] animate-[scan_3s_ease-in-out_infinite_alternate]"></div>
            </div>
            <div className="mt-4 bg-black rounded-lg p-3 font-mono text-sm border border-gray-800 text-green-400 flex items-center gap-2"><span className="text-blue-500 font-bold">$</span><span>MATCH (u:User)-[:LIKES]→(m:Movie)←[:LIKES]-(other:User) WHERE u.id = 'Alex' RETURN m</span><div className="w-2 h-4 bg-green-400 animate-pulse"></div></div>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `@keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(1000%); } }` }} />
    </div>
);

const ProfileView = ({ onLogout, currentUser, onUpdateProfile }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(currentUser.name);
    const [editAvatar, setEditAvatar] = useState(currentUser.avatar);
    const fileInputRef = useRef(null);

    const handleSave = () => {
        if (editName.trim()) {
            onUpdateProfile(editName.trim(), editAvatar);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditName(currentUser.name);
        setEditAvatar(currentUser.avatar);
        setIsEditing(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) return;
            const reader = new FileReader();
            reader.onload = (ev) => setEditAvatar(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 max-w-4xl mx-auto relative">
            {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors text-sm font-medium">
                    <Pencil size={16} /> Editar perfil
                </button>
            )}
            {isEditing && (
                <div className="absolute top-0 right-0 flex items-center gap-2">
                    <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 text-gray-400 rounded-xl hover:bg-gray-700 transition-colors text-sm"><X size={16} /> Cancelar</button>
                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors text-sm font-medium"><Save size={16} /> Guardar</button>
                </div>
            )}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
                <div className="relative">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-gray-800 shadow-2xl relative z-10 cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                        <img src={editAvatar} alt="Profile" className="w-full h-full object-cover" />
                        {isEditing && <div className="absolute inset-0 bg-black/50 flex items-center justify-center hover:bg-black/60 transition-colors"><Camera className="text-white" size={32} /></div>}
                    </div>
                    {isEditing && <div className="absolute -bottom-2 -right-2 z-20 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg" onClick={() => fileInputRef.current?.click()}><Camera size={18} /></div>}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl -z-0 transform scale-110"></div>
                </div>
                <div className="text-center md:text-left flex-1">
                    {isEditing ? (
                        <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2 text-3xl md:text-5xl font-extrabold focus:ring-2 focus:ring-blue-500 outline-none text-center md:text-left w-full" />
                    ) : (
                        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2">{currentUser.name}</h1>
                    )}
                    <p className="text-xl text-blue-400 mb-6">Explorador de Grafos</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-sm text-gray-400 mb-1">Nodos Conectados</p>
                            <p className="text-2xl font-bold text-white">342</p>
                        </div>
                        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 backdrop-blur-sm">
                            <p className="text-sm text-gray-400 mb-1">Mayor Similitud</p>
                            <p className="text-xl font-bold text-green-400">Usuario_492 (94% Afinidad)</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Clústeres Dominantes</h3>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            {['Ciencia Ficción', 'Electrónica', 'Cyberpunk'].map(g => (<span key={g} className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200 rounded-full text-sm border border-gray-700 shadow-sm">{g}</span>))}
                        </div>
                    </div>
                </div>
            </div>
            {isEditing && (
                <div className="mb-10 bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Camera size={20} className="text-blue-400" /> Elegir foto de perfil</h3>
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-colors text-sm font-medium"><Camera size={16} /> Subir imagen desde mi computadora</button>
                        <span className="text-gray-500 text-sm">JPG, PNG, GIF (max 2MB)</span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">O elegí un avatar predeterminado:</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        {avatarOptions.map((avatar, idx) => (
                            <button key={idx} onClick={() => setEditAvatar(avatar)} className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${editAvatar === avatar ? 'border-blue-500 ring-4 ring-blue-500/30 scale-110' : 'border-gray-700 hover:border-gray-500'}`}><img src={avatar} alt="" className="w-full h-full object-cover" /></button>
                        ))}
                    </div>
                </div>
            )}
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-800 pb-2">Tu Impacto de Centralidad</h2>
            <p className="text-gray-400 mb-8">Tus interacciones moldean activamente el motor de recomendación. Eres un nodo puente entre entusiastas de la <strong>Música Electrónica</strong> y amantes del cine de <strong>Ciencia Ficción</strong>.</p>
            <div className="pt-8 mb-12 border-t border-gray-800">
                <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"><LogOut size={18} /> Cerrar sesión</button>
            </div>
        </div>
    );
};

const LoginView = ({ onLogin, onUserChange }) => {
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newAvatar, setNewAvatar] = useState(avatarOptions[0]);
    const [createError, setCreateError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { setCreateError('La imagen debe ser menor a 2MB'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => setNewAvatar(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const user = await api.login(username, password);
            session.set(user);
            onUserChange(user);
            onLogin();
        } catch (err) {
            setError(err.message || 'Usuario o contraseña incorrectos');
        }
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        if (!newName.trim()) { setCreateError('El nombre es obligatorio'); return; }
        if (newName.length < 2) { setCreateError('El nombre debe tener al menos 2 caracteres'); return; }
        if (!newPassword) { setCreateError('La contraseña es obligatoria'); return; }
        if (newPassword.length < 4) { setCreateError('La contraseña debe tener al menos 4 caracteres'); return; }
        try {
            const user = await api.register(newName, newName, '', newPassword);
            session.set(user);
            onUserChange(user);
            onLogin();
        } catch (err) {
            setCreateError(err.message || 'Ese nombre de usuario ya existe');
        }
    };

    if (isCreateMode) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
                <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent pointer-events-none"></div>
                <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20"></div>
                <div className="absolute w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20"></div>
                <div className="relative z-10 w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4"><Network className="text-white" size={32} /></div>
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Crear Perfil</h1>
                    </div>
                    <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                        <div className="flex justify-center mb-6">
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-700 cursor-pointer hover:border-blue-500 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                <img src={newAvatar} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Camera size={24} className="text-white" /></div>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        </div>
                        <form onSubmit={handleCreateSubmit} className="space-y-5">
                            <div><label className="block text-sm font-medium text-gray-400 mb-2">Nombre de usuario</label><input type="text" value={newName} onChange={(e) => { setNewName(e.target.value); setCreateError(''); }} placeholder="Ej: Federico" className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" /></div>
                            <div><label className="block text-sm font-medium text-gray-400 mb-2">Contraseña</label><input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setCreateError(''); }} placeholder="Mínimo 4 caracteres" className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" /></div>
                            <div><label className="block text-sm font-medium text-gray-400 mb-2">Elegir avatar (opcional)</label><div className="grid grid-cols-5 gap-2">{avatarOptions.slice(0, 5).map((av, idx) => (<button key={idx} onClick={() => setNewAvatar(av)} type="button" className={`w-full aspect-square rounded-full overflow-hidden border-2 transition-all ${newAvatar === av ? 'border-blue-500 scale-105' : 'border-transparent hover:border-gray-600'}`}><img src={av} alt="" className="w-full h-full object-cover" /></button>))}</div></div>
                            {createError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{createError}</p>}
                            <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-green-500/20">Crear Perfil</button>
                        </form>
                        <button onClick={() => setIsCreateMode(false)} className="w-full mt-4 text-gray-400 hover:text-white text-sm py-2">← Volver al login</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent pointer-events-none"></div>
            <div className="absolute w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -top-20 -left-20"></div>
            <div className="absolute w-72 h-72 bg-purple-500/10 rounded-full blur-3xl -bottom-20 -right-20"></div>
            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto mb-4"><Network className="text-white" size={32} /></div>
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">GraphRecs</h1>
                    <p className="text-gray-400 mt-2">Motor de recomendación por grafos</p>
                </div>
                <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-xl font-bold text-white mb-6">Iniciar Sesión</h2>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div><label className="block text-sm font-medium text-gray-400 mb-2">Usuario</label><input type="text" value={username} onChange={(e) => { setUsername(e.target.value); setError(''); }} placeholder="Tu nombre de usuario" className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" /></div>
                        <div><label className="block text-sm font-medium text-gray-400 mb-2">Contraseña</label><input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••" className="w-full bg-black/40 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" /></div>
                        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">{error}</p>}
                        <button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"><Lock size={18} /> Ingresar</button>
                    </form>
                    <div className="mt-4 pt-4 border-t border-gray-800">
                        <button onClick={() => setIsCreateMode(true)} className="w-full bg-gray-800/50 border border-gray-700 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors">Crear Perfil</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SearchResultsView = ({ results, onItemClick }) => {
    if (results.length === 0) return null;
    return (<div className="animate-in fade-in duration-300"><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">{results.map((item) => (<ContentCard key={item.id} item={item} onClick={onItemClick} />))}</div></div>);
};

const MyListView = ({ items, onItemClick, onRemove }) => (
    <div className="animate-in fade-in duration-500">
        <div className="mb-8"><h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3"><Bookmark className="text-blue-500" size={36} /> Mi Lista</h1><p className="text-gray-400">{items.length} {items.length === 1 ? 'ítem' : 'ítems'} guardados</p></div>
        {items.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-gray-500"><Bookmark size={64} className="mb-4 opacity-30" /><p className="text-lg">Tu lista está vacía</p><p className="text-sm">Agrega contenido con el botón +</p></div>) : (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {items.map((item) => (<div key={item.id} className="relative flex-none w-48 md:w-56"><ContentCard item={item} onClick={onItemClick} /><button onClick={() => onRemove(item.id)} className="absolute -top-2 -right-2 z-30 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"><X size={14} /></button></div>))}
            </div>)}
    </div>
);

const LikedView = ({ items, onItemClick, onRemove }) => (
    <div className="animate-in fade-in duration-500">
        <div className="mb-8"><h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3"><Heart className="text-pink-500" size={36} /> Me Gusta</h1><p className="text-gray-400">{items.length} {items.length === 1 ? 'ítem' : 'ítems'} que te gustaron</p></div>
        {items.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-gray-500"><Heart size={64} className="mb-4 opacity-30" /><p className="text-lg">Aún no diste like a nada</p><p className="text-sm">Dale like con el botón 👍</p></div>) : (
            <div className="flex gap-4 md:gap-6 overflow-x-auto pb-6 hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {items.map((item) => (<div key={item.id} className="relative flex-none w-48 md:w-56"><ContentCard item={item} onClick={onItemClick} /><button onClick={() => onRemove(item.id)} className="absolute -top-2 -right-2 z-30 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"><X size={14} /></button></div>))}
            </div>)}
    </div>
);

const RecommendationsView = ({ recommendations, users, onItemClick, onAccept, onDismiss }) => (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
        <div className="mb-8"><h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3"><Share2 className="text-green-500" size={36} /> Recomendaciones</h1><p className="text-gray-400">{recommendations.length} recomendaciones de otros usuarios</p></div>
        {recommendations.length === 0 ? (<div className="flex flex-col items-center justify-center py-20 text-gray-500"><Share2 size={64} className="mb-4 opacity-30" /><p className="text-lg">No tenés recomendaciones aún</p><p className="text-sm">Cuando otro usuario te recomiende contenido aparecerá acá</p></div>) : (
            <div className="space-y-4">
                {recommendations.map((rec) => {
                    const fromUser = users.find(u => u.name === rec.from) || { name: rec.from, avatar: avatarOptions[0] };
                    return (
                        <div key={rec.id} className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors">
                            <div className="flex flex-col sm:flex-row">
                                <div className="relative flex-none w-full sm:w-40 h-48 sm:h-auto">
                                    <img src={rec?.item?.image || 'https://via.placeholder.com/150'} alt={rec?.item?.title || 'Contenido'} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-900/80 hidden sm:block"></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent sm:hidden"></div>
                                </div>
                                <div className="flex-1 p-5 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <img src={fromUser.avatar} alt={fromUser.name} className="w-9 h-9 rounded-full border border-gray-700" />
                                            <div>
                                                <p className="text-white font-medium text-sm">{fromUser.name}</p>
                                                <p className="text-gray-500 text-xs">{timeAgo(rec.time)}</p>
                                            </div>
                                            <NeonBadge color="purple">Recomendación</NeonBadge>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-1 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => onItemClick(rec?.item)}>{rec?.item?.title || 'Contenido recomendado'}</h3>
                                        <p className="text-gray-400 text-sm mb-3">{rec?.item?.type || rec?.item?.artist || 'Desconocido'} · {rec?.item?.year || ''}</p>
                                        <p className="text-gray-300 text-sm italic">"{rec.message}"</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-5">
                                        <button onClick={() => rec?.item && onAccept?.(rec)} className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-xl hover:bg-blue-500/20 transition-colors text-sm font-medium"><Plus size={16} /> Agregar a Mi Lista</button>
                                        <button onClick={() => onDismiss?.(rec.id)} className="text-gray-500 hover:text-gray-300 p-2 hover:bg-gray-800 rounded-lg transition-colors"><X size={18} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>)}
    </div>
);

const RecommendModal = ({ item, onClose, users, currentUserId, onSend }) => {
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    if (!item) return null;

    const otherUsers = users.filter(u => u.id !== currentUserId);

    const toggleUser = (id) => {
        setSelectedUsers(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSend = () => {
        if (selectedUsers.size === 0) return;
        onSend(item, [...selectedUsers], message);
        setSent(true);
        setTimeout(onClose, 1200);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-black/80 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative z-50 w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Send size={20} className="text-blue-400" /> Recomendar</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg transition-colors"><X size={20} /></button>
                </div>
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-5 bg-gray-800/50 rounded-xl p-3">
                        <img src={item.image} alt={item.title} className="w-12 h-16 rounded-lg object-cover" />
                        <div><p className="text-white font-bold">{item.title}</p><p className="text-gray-400 text-sm">{item.type || item.artist} · {item.year}</p></div>
                    </div>
                    {sent ? (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Send size={28} className="text-green-400" /></div>
                            <p className="text-green-400 font-bold text-lg">¡Enviado!</p>
                            <p className="text-gray-400 text-sm">Recomendación enviada a {selectedUsers.size} {selectedUsers.size === 1 ? 'usuario' : 'usuarios'}</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-400 mb-3">Seleccioná usuarios para recomendar:</p>
                            {otherUsers.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No hay otros usuarios registrados aún</p>
                            ) : (
                                <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
                                    {otherUsers.map(u => {
                                        const isSelected = selectedUsers.has(u.id);
                                        return (
                                            <button key={u.id} onClick={() => toggleUser(u.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isSelected ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-gray-800/30 border border-gray-800 hover:bg-gray-800/60'}`}>
                                                <img src={u.avatar} alt={u.name} className="w-9 h-9 rounded-full border border-gray-700" />
                                                <div className="flex-1 text-left"><p className="text-white text-sm font-medium">{u.name}</p><p className="text-gray-500 text-xs">Miembro</p></div>
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'}`}>{isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Agregá un mensaje (opcional)" className="w-full bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all mb-4" />
                            <button onClick={handleSend} disabled={selectedUsers.size === 0} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedUsers.size > 0 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}><Send size={18} /> Enviar recomendación</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(() => !!session.get());
    const [currentUser, setCurrentUser] = useState(() => session.get());
    const [activeTab, setActiveTab] = useState('home');
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [ratingItem, setRatingItem] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [movies, setMovies] = useState([]);
    const [series, setSeries] = useState([]);
    const [myList, setMyList] = useState([]);
    const [liked, setLiked] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingHome, setLoadingHome] = useState(true);
    const [searchResults, setSearchResults] = useState([]);

    // Cargar datos al loguear
    useEffect(() => {
        if (!isLoggedIn || !currentUser) return;
        const email = currentUser.email;
        setLoadingHome(true);
        Promise.all([
            api.getMovies(),
            api.getSeries(),
            api.getGuardados(email),
            api.getLikes(email),
            api.getRecommendations(email),
        ]).then(([movs, sers, guard, liks, recs]) => {
            setMovies(movs);
            setSeries(sers);
            setMyList(guard);
            setLiked(liks);
            setRecommendations(recs);
        }).catch(console.error)
          .finally(() => setLoadingHome(false));
    }, [isLoggedIn, currentUser?.email]);

    // Busqueda en tiempo real
    useEffect(() => {
        if (!searchQuery.trim()) { setSearchResults([]); return; }
        const q = searchQuery.toLowerCase();
        const all = [
            ...movies.map(m => ({ ...m, title: m.titulo, year: m.anio, image: m.imagen, genres: m.generos, type: 'Pelicula', match: null })),
            ...series.map(s => ({ ...s, title: s.titulo, year: s.anio, image: s.imagen, genres: s.generos, type: 'Serie', match: null })),
        ];
        setSearchResults(all.filter(i =>
            i.title?.toLowerCase().includes(q) ||
            i.genres?.some(g => g.toLowerCase().includes(q))
        ));
    }, [searchQuery, movies, series]);

    const mapMovie = (m) => ({ id: m.id, title: m.titulo, year: m.anio, image: m.imagen, genres: m.generos || [], type: 'Pelicula', match: null, description: '' });
    const mapSerie = (s) => ({ id: s.id, title: s.titulo, year: s.anio, image: s.imagen, genres: s.generos || [], type: 'Serie', match: null, description: '' });
    const mapRec = (r) => ({ id: r?.contenido?.id, title: r?.contenido?.titulo, year: r?.contenido?.anio, image: r?.contenido?.imagen, genres: r?.contenido?.generos || [], type: r?.contenido?.tipo, match: r?.puntuacion, description: r?.resena || '' });

    const moviesUI = movies.map(mapMovie);
    const seriesUI = series.map(mapSerie);
    const recsUI = recommendations.map(mapRec);

    const myListIds = new Set(myList.map(i => i.id));
    const likedIds = new Set(liked.map(i => i.id));

    const toggleMyList = async (item) => {
        if (!currentUser) return;
        try {
            if (myListIds.has(item.id)) {
                await api.quitarGuardado(currentUser.email, item.id);
                setMyList(prev => prev.filter(i => i.id !== item.id));
            } else {
                await api.guardar(currentUser.email, item.id);
                setMyList(prev => [...prev, { id: item.id, titulo: item.title, imagen: item.image, anio: item.year }]);
            }
        } catch (e) { console.error(e); }
    };

    const toggleLike = async (item) => {
        if (!currentUser) return;
        try {
            if (likedIds.has(item.id)) {
                await api.quitarLike(currentUser.email, item.id);
                setLiked(prev => prev.filter(i => i.id !== item.id));
            } else {
                await api.like(currentUser.email, item.id);
                setLiked(prev => [...prev, { id: item.id, titulo: item.title, imagen: item.image, anio: item.year }]);
            }
        } catch (e) { console.error(e); }
    };

    const handleLogout = () => {
        session.clear();
        setIsLoggedIn(false);
        setCurrentUser(null);
        setActiveTab('home');
    };

    const updateProfile = async (nombre, pais) => {
        if (!currentUser) return;
        try {
            await api.updateUser(currentUser.email, nombre, pais);
            const updated = { ...currentUser, nombre, name: nombre };
            setCurrentUser(updated);
            session.set(updated);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const featured = moviesUI[0] || seriesUI[0];

    const navItems = [
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'mylist', icon: Bookmark, label: 'Mi Lista', count: myList.length },
        { id: 'liked', icon: Heart, label: 'Me Gusta', count: liked.length },
        { id: 'recommendations', icon: Share2, label: 'Recomendaciones', count: recommendations.length },
        { id: 'friends', icon: Users, label: 'Amigos' },
        { id: 'graph', icon: Database, label: 'Insights Neo4j' },
        { id: 'profile', icon: User, label: 'Perfil' },
    ];

    if (!isLoggedIn) {
        return <LoginView onLogin={(user) => { setCurrentUser(user); setIsLoggedIn(true); }} />;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-gray-100 font-sans selection:bg-blue-500/30">
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent pointer-events-none z-0"></div>

            <aside
                className="fixed top-0 left-0 h-screen bg-black/40 backdrop-blur-xl border-r border-gray-800/50 hidden md:flex flex-col z-40 transition-all duration-300 overflow-hidden"
                style={{ width: sidebarExpanded ? '16rem' : '5rem' }}
                onMouseEnter={() => setSidebarExpanded(true)}
                onMouseLeave={() => setSidebarExpanded(false)}
            >
                <div className={`flex items-center gap-3 transition-all duration-300 ${sidebarExpanded ? 'px-6 py-5' : 'p-4 justify-center'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0"><Network className="text-white" size={20} /></div>
                    <span className={`text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 transition-all duration-300 whitespace-nowrap ${sidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>GraphRecs</span>
                </div>
                <nav className="flex-1 px-3 space-y-2 overflow-hidden">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group whitespace-nowrap ${activeTab === item.id ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                            <item.icon size={22} className={`transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`} />
                            <span className={`font-medium flex-1 text-left transition-all duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>{item.label}</span>
                            {item.count !== undefined && item.count > 0 && (<span className={`text-xs px-2 py-0.5 rounded-full font-bold transition-all duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0'} ${activeTab === item.id ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>{item.count}</span>)}
                        </button>
                    ))}
                </nav>
                <div className="px-3 pb-3 space-y-2">
                    <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group whitespace-nowrap text-gray-400 hover:text-white hover:bg-white/5 border border-transparent`}>
                        <img src={currentUser?.avatar || avatarOptions[0]} alt="User" className="w-[22px] h-[22px] rounded-full border border-gray-700 flex-shrink-0" />
                        <span className={`font-medium flex-1 text-left transition-all duration-300 whitespace-nowrap ${sidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>
                            {currentUser?.name}
                            <span className="block text-xs text-green-400 font-normal"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1"></span>En línea</span>
                        </span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group whitespace-nowrap text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent">
                        <LogOut size={22} className="flex-shrink-0" />
                        <span className={`font-medium transition-all duration-300 whitespace-nowrap ${sidebarExpanded ? 'opacity-100' : 'opacity-0'}`}>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            <div className="md:hidden fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-lg border-t border-gray-800 z-50 px-2 py-2 flex justify-between items-center pb-safe overflow-x-auto">
                {navItems.slice(0, 6).map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center gap-1 min-w-0 px-2 ${activeTab === item.id ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                        <div className="relative"><item.icon size={22} />{item.count !== undefined && item.count > 0 && (<span className="absolute -top-1 -right-2 bg-blue-500 text-white text-[8px] px-1 rounded-full">{item.count}</span>)}</div>
                        <span className="text-[9px] font-medium">{item.label}</span>
                    </button>
                ))}
            </div>

            <main className={`transition-all duration-300 min-h-screen relative z-10 pb-24 md:pb-0 ${sidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
                <header className={`sticky top-0 w-full z-30 transition-all duration-300 px-6 py-4 flex items-center justify-between ${scrolled ? 'bg-black/70 backdrop-blur-md border-b border-gray-800/50' : 'bg-transparent'}`}>
                    <div className="flex-1 flex items-center">
                        <div className="md:hidden flex items-center gap-2 mr-4"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><Network className="text-white" size={18} /></div></div>
                        <div className="relative w-full max-w-md group hidden sm:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.trim() && activeTab === 'home') setActiveTab('search'); if (!e.target.value.trim() && activeTab === 'search') setActiveTab('home'); }} placeholder="Buscar películas, canciones, géneros..." className="w-full bg-gray-900/50 border border-gray-700/50 text-white placeholder-gray-500 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-white sm:hidden"><Search size={24} /></button>
                        <button className="text-gray-400 hover:text-white relative"><Activity size={24} /><span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)]"></span></button>
                    </div>
                </header>

                <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto pt-6">
                    {activeTab === 'home' && (
                        <div className="animate-in fade-in duration-500">
                            {loadingHome ? (
                                <div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>
                            ) : (
                              <>
                                {featured && (
                                    <div className="relative rounded-3xl overflow-hidden mb-12 h-64 md:h-96 group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent z-10" />
                                        <img src={featured.image || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop'} alt="Featured" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                                        <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20 w-full md:w-2/3">
                                            <div className="flex gap-2 mb-3"><NeonBadge color="blue">Recomendado por Neo4j</NeonBadge><NeonBadge color="purple">{featured.type}</NeonBadge></div>
                                            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg tracking-tight">{featured.title}</h1>
                                            <div className="flex gap-4">
                                                <button className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 hover:scale-105 transition-all" onClick={() => setSelectedItem(featured)}><Play fill="currentColor" size={20} /> Ver Detalle</button>
                                                <button className="bg-gray-800/80 text-white backdrop-blur-md px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-700 transition-all border border-gray-600" onClick={() => setRatingItem(featured)}><Star size={20} /> Calificar</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {moviesUI.length > 0 && <Carousel title="Películas" subtitle="Catálogo completo" icon={Network} items={moviesUI} onCardClick={setSelectedItem} onAddToList={toggleMyList} onLike={toggleLike} onRecommend={setRatingItem} myListIds={myListIds} likedIds={likedIds} />}
                                {seriesUI.length > 0 && <Carousel title="Series" subtitle="Catálogo completo" icon={Activity} items={seriesUI} onCardClick={setSelectedItem} onAddToList={toggleMyList} onLike={toggleLike} onRecommend={setRatingItem} myListIds={myListIds} likedIds={likedIds} />}
                                {recsUI.length > 0 && <Carousel title="Recomendado por tus amigos" subtitle="Filtrado colaborativo" icon={Share2} items={recsUI} onCardClick={setSelectedItem} onAddToList={toggleMyList} onLike={toggleLike} onRecommend={setRatingItem} myListIds={myListIds} likedIds={likedIds} />}
                                {moviesUI.length === 0 && seriesUI.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500"><Database size={56} className="mb-4 opacity-30" /><p className="text-lg">No hay contenido en la base de datos</p><p className="text-sm mt-1">Ejecutá el seed para cargar datos</p></div>
                                )}
                              </>
                            )}
                        </div>
                    )}
                    {activeTab === 'search' && (searchResults.length > 0 ? (<SearchResultsView results={searchResults} onItemClick={setSelectedItem} />) : (<div className="flex flex-col items-center justify-center py-20 text-gray-500"><Search size={64} className="mb-4 opacity-30" /><p className="text-lg">No se encontraron resultados para "{searchQuery}"</p></div>))}
                    {activeTab === 'mylist' && <MyListView items={myList.map(i => ({ id: i.id, title: i.titulo, image: i.imagen, year: i.anio, genres: [], type: 'Contenido' }))} onItemClick={setSelectedItem} onRemove={(id) => toggleMyList({ id })} />}
                    {activeTab === 'liked' && <LikedView items={liked.map(i => ({ id: i.id, title: i.titulo, image: i.imagen, year: i.anio, genres: [], type: 'Contenido' }))} onItemClick={setSelectedItem} onRemove={(id) => toggleLike({ id })} />}
                    {activeTab === 'recommendations' && <RecommendationsView recommendations={recsUI.map((r, i) => ({ id: i, item: r, from: recommendations[i]?.recomienda || '?', message: recommendations[i]?.resena || '', time: new Date().toISOString() }))} users={[]} onItemClick={setSelectedItem} onAccept={(rec) => toggleMyList(rec.item)} onDismiss={() => {}} />}
                    {activeTab === 'friends' && currentUser && <FriendsView currentEmail={currentUser.email} />}
                    {activeTab === 'graph' && <GraphDashboard />}
                    {activeTab === 'profile' && currentUser && <ProfileView onLogout={handleLogout} currentUser={{ ...currentUser, name: currentUser.nombre || currentUser.name || currentUser.email }} onUpdateProfile={updateProfile} />}
                </div>
            </main>

            {selectedItem && (<DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />)}
            {ratingItem && currentUser && (<RatingModal item={{ id: ratingItem.id, titulo: ratingItem.title, tipo: ratingItem.type, anio: ratingItem.year, imagen: ratingItem.image }} currentEmail={currentUser.email} onClose={() => setRatingItem(null)} onSuccess={() => {}} />)}

            <style dangerouslySetInnerHTML={{ __html: `.hide-scrollbar::-webkit-scrollbar { display: none; }` }} />
        </div>
    );
}
