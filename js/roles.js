// Roles: OWNER, ADMIN, MOD, USER. Se leen de /roles en la base de datos (USER = sin entrada).
(() => {
  const base = (NOVA.db.url || '').replace(/\/$/, '');
  window.Roles = {
    list: ['OWNER', 'ADMIN', 'MOD', 'USER'], map: {},
    async load() { if (!base) return; const r = await fetch(`${base}/roles.json`); if (!r.ok) throw new Error('net'); this.map = (await r.json()) || {}; },
    fixed(name) { return ((NOVA.auth && NOVA.auth.owners) || []).some(o => o.toLowerCase() === String(name || '').toLowerCase()); },
    of(name) { if (this.fixed(name)) return 'OWNER'; const r = this.map[String(name || '').toLowerCase()]; return this.list.includes(r) ? r : 'USER'; },
    badge(role) { const b = document.createElement('span'), i = document.createElement('i'); b.className = 'role r-' + role.toLowerCase(); i.textContent = role; b.append(i); return b; }
  };
})();
