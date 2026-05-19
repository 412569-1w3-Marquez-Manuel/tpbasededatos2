import React from 'react';

export function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4 border' : size === 'lg' ? 'w-12 h-12 border-3' : 'w-8 h-8 border-2';
  return <div className={`${s} border-blue-500/30 border-t-blue-500 rounded-full animate-spin`} />;
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Spinner size="lg" />
      <p className="text-gray-500 text-sm">Cargando...</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      {Icon && <Icon size={56} className="mb-4 opacity-30" />}
      <p className="text-lg font-medium">{title}</p>
      {subtitle && <p className="text-sm mt-1 text-gray-600">{subtitle}</p>}
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center justify-between">
      <span>{message}</span>
      {onDismiss && <button onClick={onDismiss} className="ml-3 text-red-400 hover:text-red-300">✕</button>}
    </div>
  );
}
