// Capa de datos: Firebase Realtime Database valida el UID de cada cuenta.
(() => {
  const base = (NOVA.db.url || '').replace(/\/$/, ''), LS = 'nova-users';
  const key = n => String(n || '').toLowerCase();
  const local = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };
  const saveLocal = a => localStorage.setItem(LS, JSON.stringify(a));
  const url = async p => { const t = await Auth.token(); if (!t) throw new Error('auth'); return `${base}/${p}.json?auth=${encodeURIComponent(t)}`; };
  const chk = r => { if (r.status === 401 || r.status === 403) throw new Error('auth'); if (!r.ok) throw new Error('http:' + r.status); };
  window.Store = {
    online: !!base, key,
    async get(name) { if (!base) return local()[key(name)] || null; const r = await fetch(`${base}/users/${key(name)}.json`); if (!r.ok) throw new Error('net'); return await r.json(); },
    async claim(u) { if (!base) { const a = local(); if (a[key(u.name)]) throw new Error('taken'); a[key(u.name)] = u; saveLocal(a); return; } const r = await fetch(await url('users/' + key(u.name)), { method: 'PUT', headers: { 'if-match': 'null_etag' }, body: JSON.stringify(u) }); if (r.status === 412) throw new Error('taken'); chk(r); },
    async update(u) { if (!base) { const a = local(); a[key(u.name)] = u; saveLocal(a); return; } chk(await fetch(await url('users/' + key(u.name)), { method: 'PUT', body: JSON.stringify(u) })); },
    async remove(name) { if (!base) { const a = local(); delete a[key(name)]; saveLocal(a); return; } chk(await fetch(await url('users/' + key(name)), { method: 'DELETE' })); },
    async ping() { if (!base) return true; const r = await fetch(`${base}/users.json?shallow=true`); if (!r.ok) throw new Error('net'); return true; },
    async all() { if (!base) return Object.values(local()); const r = await fetch(`${base}/users.json`); if (!r.ok) throw new Error('net'); return Object.values(await r.json() || {}); }
  };
  window.Me = { get() { try { return JSON.parse(localStorage.getItem('nova-me')); } catch { return null; } }, set(u) { localStorage.setItem('nova-me', JSON.stringify(u)); }, clear() { localStorage.removeItem('nova-me'); } };
})();
