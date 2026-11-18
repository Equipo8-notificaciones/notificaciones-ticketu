"use client";
import { useState } from 'react';
export default function SessionActions({ nombre }: { nombre: string }) {
  const [error, setError] = useState('');
  async function salir() {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!res.ok) throw new Error();
      window.location.assign('/admin/login');
    } catch { setError('No se pudo cerrar la sesión. Intenta nuevamente.'); }
  }
  return <div style={{ padding: 16 }}><span>{nombre} </span><button onClick={salir}>Cerrar sesión</button>{error && <p role="alert">{error}</p>}</div>;
}
