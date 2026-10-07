(() => {
  const me = Me.get(); if (!me) return;
  const list = document.getElementById('messages'), form = document.getElementById('chatForm'), text = document.getElementById('text');
  const dot = document.getElementById('status'), label = document.getElementById('statusText'), seen = new Set();
  const empty = document.createElement('li'); empty.className = 'empty'; empty.textContent = 'Aún no hay mensajes. Escribe el primero.'; list.append(empty);
  document.getElementById('who').textContent = '@' + me.name;
  const up = () => { dot.classList.add('on'); label.textContent = 'En línea · sala global'; };
  const down = t => { dot.classList.remove('on'); label.textContent = t || 'Reconectando…'; };

  function paint(li) { const role = Roles.of(li.dataset.u); li.dataset.role = role; li.querySelector('.slot').replaceChildren(Roles.badge(role)); }
  const repaint = () => list.querySelectorAll('.msg').forEach(paint);

  // Mensaje { id, n: usuario, t: texto, ts: ms }. Nombre en RGB global (.flow) + insignia de rol.
  function add({ id, n, t, ts }) {
    if (!id || seen.has(id) || typeof t !== 'string') return; seen.add(id); empty.remove();
    const li = document.createElement('li'); li.className = 'msg' + (n === me.name ? ' me' : ''); li.dataset.u = String(n || '').toLowerCase();
    const head = document.createElement('div'); head.className = 'who';
    const nick = document.createElement('strong'); nick.className = 'nick flow'; nick.textContent = n || 'Anónimo';
    const slot = document.createElement('span'); slot.className = 'slot'; head.append(nick, slot);
    const p = document.createElement('span'); p.textContent = t;
    const tm = document.createElement('time'); tm.textContent = new Date(ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.append(head, p, tm); paint(li); list.append(li); list.scrollTop = list.scrollHeight;
  }

  let send;
  function start() {
    if (Store.online) {                     // Firebase Realtime Database (SSE, historial persistente)
      const base = NOVA.db.url.replace(/\/$/, '');
      const es = new EventSource(`${base}/messages.json?orderBy=${encodeURIComponent('"$key"')}&limitToLast=60`);
      es.onopen = up; es.onerror = () => down();
      es.addEventListener('cancel', () => down('Sin permiso en la base de datos. Revisa las reglas.'));
      es.addEventListener('put', e => {
        up(); const { path, data } = JSON.parse(e.data); if (data === null) return;
        if (path === '/') Object.entries(data).map(([id, m]) => ({ id, ...m })).sort((a, b) => a.ts - b.ts).forEach(add);
        else if (path.split('/').length === 2) add({ id: path.slice(1), ...data });
      });
      send = async t => { const r = await fetch(`${base}/messages.json`, { method: 'POST', body: JSON.stringify({ n: me.name, t, ts: { '.sv': 'timestamp' } }) }); if (!r.ok) throw 0; };
    } else {                                // Respaldo sin configuración: ntfy.sh
      const { server, room, history } = NOVA.chat;
      const es = new EventSource(`${server}/${room}/sse?since=${history}`);
      es.onopen = up; es.onerror = () => down();
      es.onmessage = e => { const m = JSON.parse(e.data); if (m.event === 'message') add({ id: m.id, n: m.title, t: m.message, ts: m.time * 1000 }); };
      send = async t => { const r = await fetch(server, { method: 'POST', body: JSON.stringify({ topic: room, title: me.name, message: t }) }); if (!r.ok) throw 0; };
    }
  }
  Roles.load().catch(() => {}).then(start);                    // primero los roles, luego los mensajes
  setInterval(() => Roles.load().then(repaint).catch(() => {}), 30000);

  let last = 0;
  form.addEventListener('submit', async e => {
    e.preventDefault(); const t = text.value.trim(); if (!t || !send || Date.now() - last < 1200) return; last = Date.now(); text.value = '';
    try { await send(t); localStorage.setItem('nova-msgs', (+localStorage.getItem('nova-msgs') || 0) + 1); }
    catch { down('No se pudo enviar. Revisa tu conexión.'); }
  });
})();
