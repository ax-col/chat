// Capa de datos: usuarios únicos. Firebase REST si hay URL; si no, modo demo en localStorage.
(() => {
  const base = (NOVA.db.url || '').replace(/\/$/, ''), LS = 'nova-users';
  const key = n => n.toLowerCase();
  const local = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };
  const put = (u, h = {}) => fetch(`${base}/users/${key(u.name)}.json`, { method: 'PUT', headers: h, body: JSON.stringify(u) });
  window.Store = {
    online: !!base, key,
    async claim(u) {                      // crea el usuario solo si NO existe (atómico en Firebase)
      if (!base) { const a = local(); if (a[key(u.name)]) throw new Error('taken'); a[key(u.name)] = u; localStorage.setItem(LS, JSON.stringify(a)); return; }
      const r = await put(u, { 'if-match': 'null_etag' });
      if (r.status === 412) throw new Error('taken');
      if (!r.ok) throw new Error('net');
    },
    async update(u) { if (!base) { const a = local(); a[key(u.name)] = u; localStorage.setItem(LS, JSON.stringify(a)); return; } if (!(await put(u)).ok) throw new Error('net'); },
    async remove(name) { if (!base) { const a = local(); delete a[key(name)]; localStorage.setItem(LS, JSON.stringify(a)); return; } await fetch(`${base}/users/${key(name)}.json`, { method: 'DELETE' }); },
    async ping() { if (!base) return true; const r = await fetch(`${base}/users.json?shallow=true`); if (!r.ok) throw new Error('net'); return true; },
    async all() { if (!base) return Object.values(local()); const r = await fetch(`${base}/users.json`); if (!r.ok) throw new Error('net'); return Object.values(await r.json() || {}); }
  };
  window.Me = {
    get() { try { return JSON.parse(localStorage.getItem('nova-me')); } catch { return null; } },
    set(u) { localStorage.setItem('nova-me', JSON.stringify(u)); },
    clear() { localStorage.removeItem('nova-me'); }
  };
})();
