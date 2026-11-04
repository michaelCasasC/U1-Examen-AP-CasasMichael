import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import './style.css';

const emptyForm = {
  source_id: null, content_type: 'MOVIE', title: '', date_added: '', release_year: '',
  rating: '', duration_value: '', duration_unit: 'MINUTES', duration_text: '', description: ''
};

const App = () => {
  const [contents, setContents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [notice, setNotice] = useState('Conectando al servidor...');

  const load = useCallback(async () => {
    const response = await fetch(`/api/content?page=1&limit=50&search=${encodeURIComponent(search)}`);
    if (!response.ok) throw new Error('No se pudo cargar el contenido');
    setContents((await response.json()).data);
  }, [search]);

  useEffect(() => { load().catch((error) => setNotice(error.message)); }, [load]);

  useEffect(() => {
    const socket = io();
    socket.on('connect', () => setNotice('Socket.IO conectado'));
    socket.on('content:created', (item) => {
      setContents((current) => [item, ...current]);
      setNotice('Sincronizado: registro creado');
    });
    socket.on('content:updated', (item) => {
      setContents((current) => current.map((entry) => entry.id === item.id ? item : entry));
      setNotice('Sincronizado: registro actualizado');
    });
    socket.on('content:deleted', ({ id }) => {
      setContents((current) => current.filter((item) => item.id !== id));
      setNotice('Sincronizado: registro eliminado');
    });
    socket.on('connect_error', () => setNotice('Socket.IO no disponible'));
    return () => socket.disconnect();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value === '' ? null : value]));
    for (const key of ['release_year', 'duration_value']) if (payload[key] !== null) payload[key] = Number(payload[key]);
    const response = await fetch(editingId ? `/api/content/${editingId}` : '/api/content', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) { setNotice((await response.json()).error || 'Error al guardar'); return; }
    setForm(emptyForm); setEditingId(null);
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm(Object.fromEntries(Object.keys(emptyForm).map((key) => [key, item[key] ?? ''])));
  };

  const remove = async (id) => {
    if (!window.confirm('¿Eliminar este contenido?')) return;
    await fetch(`/api/content/${id}`, { method: 'DELETE' });
  };

  const runStats = async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const response = await fetch('/api/content/stats');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudieron calcular las estadísticas');
      setStats(result);
    } catch (error) {
      setStatsError(error.message);
    } finally {
      setStatsLoading(false);
    }
  };

  return <main>
    <header><div><h1>PrimeVideoDB · Content</h1><p>{notice}</p></div><button onClick={runStats} disabled={statsLoading}>{statsLoading ? 'Calculando...' : 'Calcular estadísticas'}</button></header>
    <section><h2>{editingId ? 'Editar contenido' : 'Registrar contenido'}</h2><form onSubmit={submit}>
      <select value={form.content_type} onChange={(e) => setForm({ ...form, content_type: e.target.value })}><option>MOVIE</option><option>TV_SHOW</option><option>OTHER</option></select>
      <input placeholder="Título" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input placeholder="Año" type="number" value={form.release_year} onChange={(e) => setForm({ ...form, release_year: e.target.value })} />
      <input placeholder="Rating" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
      <input placeholder="Duración" type="number" value={form.duration_value} onChange={(e) => setForm({ ...form, duration_value: e.target.value })} />
      <input placeholder="Texto de duración" value={form.duration_text} onChange={(e) => setForm({ ...form, duration_text: e.target.value })} />
      <textarea placeholder="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button type="submit">{editingId ? 'Guardar cambios' : 'Registrar'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Cancelar</button>}
    </form></section>
    {statsError && <section><h2>Error de estadísticas</h2><p>{statsError}</p></section>}
    {stats && <section><h2>Estadísticas concurrentes</h2><p>Procesados en Worker Thread: <b>{stats.processed}</b></p><table><thead><tr><th>Tipo</th><th>Total</th></tr></thead><tbody>{Object.entries(stats.byType || {}).map(([type, total]) => <tr key={type}><td>{type}</td><td>{total}</td></tr>)}</tbody></table></section>}
    <section><div className="list-header"><h2>Contenidos</h2><input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <table><thead><tr><th>ID</th><th>Tipo</th><th>Título</th><th>Año</th><th>Rating</th><th>Acciones</th></tr></thead><tbody>
        {contents.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.content_type}</td><td>{item.title}</td><td>{item.release_year || '-'}</td><td>{item.rating || '-'}</td><td><button onClick={() => edit(item)}>Editar</button> <button onClick={() => remove(item.id)}>Eliminar</button></td></tr>)}
      </tbody></table>
    </section>
  </main>;
};
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
