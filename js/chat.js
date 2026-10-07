(() => {
  const me = Me.get(); if (!me) return;
  const list = document.getElementById('messages'), form = document.getElementById('chatForm'), text = document.getElementById('text');
  const dot = document.getElementById('status'), label = document.getElementById('statusText'), seen = new Set(), loadedAt = Date.now();
  const empty = document.createElement('li'); empty.className = 'empty'; empty.textContent = 'Aún no hay mensajes. Escribe el primero.'; list.append(empty);
  document.getElementById('who').textContent = '@' + me.name;
  const setStatus = t => { if (label) label.textContent = t; };
  const up = () => { dot.classList.add('on'); setStatus('En línea · sala global'); };
  const down = t => { dot.classList.remove('on'); setStatus(t || 'Reconectando…'); };

  function paint(li) { const role = Roles.of(li.dataset.u); li.dataset.role = role; li.querySelector('.slot').replaceChildren(Roles.badge(role)); }
  const repaint = () => list.querySelectorAll('.msg').forEach(paint);
  const mark = () => list.classList.toggle('staff-on', !!(window.Staff && Staff.level() >= 1));
  addEventListener('staff-change', mark); mark();

  // Mensaje { id, n: usuario, t: texto, ts: ms }. Devuelve true si era nuevo.
  async function reportMessage(id, n) {
    if (!Store.online) return alert('Los reportes requieren la base de datos conectada.');
    const reason = (prompt(`Motivo del reporte de @${n}:`, 'Contenido inapropiado') || '').trim(); if (!reason) return;
    const body = JSON.stringify({ messageId: id, n, reporter: Auth.uid(), reporterName: me.name, reason, ts: { '.sv': 'timestamp' }, status: 'open' });
    let tk = await Auth.token(); if (!tk) throw new Error('auth');
    let r = await fetch(`${NOVA.db.url.replace(/\/$/, '')}/reports.json?auth=${encodeURIComponent(tk)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (r.status === 401 || r.status === 403) { tk = await Auth.token(true); if (!tk) throw new Error('auth'); r = await fetch(`${NOVA.db.url.replace(/\/$/, '')}/reports.json?auth=${encodeURIComponent(tk)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); }
    if (!r.ok) throw new Error('report'); setStatus('Reporte enviado al equipo.');
  }

  function add({ id, n, t, ts }) {
    if (!id || seen.has(id) || typeof t !== 'string') return false; seen.add(id); empty.remove();
    const li = document.createElement('li'); li.className = 'msg' + (n === me.name ? ' me' : ''); li.dataset.u = String(n || '').toLowerCase(); li.dataset.id = id;
    const head = document.createElement('div'); head.className = 'who';
    const nick = document.createElement('strong'); nick.className = 'nick flow'; nick.textContent = n || 'Anónimo';
    const slot = document.createElement('span'); slot.className = 'slot'; head.append(nick, slot);
    const p = document.createElement('span'); p.textContent = t;
    const tm = document.createElement('time'); tm.textContent = new Date(ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const report = document.createElement('button'); report.type = 'button'; report.className = 'report'; report.textContent = '⚑'; report.title = 'Reportar mensaje'; report.setAttribute('aria-label', 'Reportar mensaje'); report.hidden = n === me.name;
    report.onclick = async () => { try { await reportMessage(id, n); } catch (e) { down(e.message === 'auth' ? 'Sesión vencida. Recarga la página.' : 'No se pudo enviar el reporte.'); } };
    const del = document.createElement('button'); del.type = 'button'; del.className = 'del'; del.textContent = '×'; del.setAttribute('aria-label', 'Eliminar mensaje');
    del.onclick = async () => { try { await Staff.deleteMessage(id); li.remove(); } catch { down('No se pudo eliminar. Inicia sesión de staff.'); } };
    li.append(head, p, tm, report, del); paint(li); list.append(li); list.scrollTop = list.scrollHeight; return true;
  }
  const drop = id => { const li = list.querySelector(`.msg[data-id="${CSS.escape(id)}"]`); if (li) li.remove(); };

  let send, ready = false;
  function start() {
    if (Store.online) {                     // Firebase Realtime Database (SSE, historial persistente)
      const base = NOVA.db.url.replace(/\/$/, '');
      const es = new EventSource(`${base}/messages.json?orderBy=${encodeURIComponent('"$key"')}&limitToLast=60`);
      es.onopen = up; es.onerror = () => down();
      es.addEventListener('cancel', () => down('Sin permiso en la base de datos. Revisa las reglas.'));
      es.addEventListener('put', e => {
        up(); const { path, data } = JSON.parse(e.data), parts = path.split('/');
        if (path === '/') { if (data) Object.entries(data).map(([id, m]) => ({ id, ...m })).sort((a, b) => a.ts - b.ts).forEach(add); ready = true; }
        else if (parts.length === 2) { if (data === null) drop(path.slice(1)); else { const m = { id: path.slice(1), ...data }; if (add(m) && ready && window.Notify) Notify.message(m); } }
      });
      send = async t => {
        const tk = await Auth.token(); if (!tk) throw 0;
        const sanctions = await fetch(`${base}/sanctions.json?auth=${encodeURIComponent(tk)}`).then(r => r.ok ? r.json() : {}).catch(() => ({}));
        const sanction = sanctions && sanctions[String(me.name).toLowerCase()];
        if (sanction && (sanction.type === 'ban' || sanction.until > Date.now())) throw new Error(sanction.type === 'ban' ? 'banned' : 'muted');
        const r = await fetch(`${base}/messages.json?auth=${encodeURIComponent(tk)}`, { method: 'POST', body: JSON.stringify({ n: me.name, t, ts: { '.sv': 'timestamp' }, uid: Auth.uid() }) });
        if (!r.ok) throw 0;
      };
    } else {                                // Respaldo sin configuración: ntfy.sh
      const { server, room, history } = NOVA.chat;
      const es = new EventSource(`${server}/${room}/sse?since=${history}`);
      es.onopen = up; es.onerror = () => down();
      es.onmessage = e => { const m = JSON.parse(e.data); if (m.event !== 'message') return; const x = { id: m.id, n: m.title, t: m.message, ts: m.time * 1000 }; if (add(x) && x.ts >= loadedAt - 2000 && window.Notify) Notify.message(x); };
      send = async t => { const r = await fetch(server, { method: 'POST', body: JSON.stringify({ topic: room, title: me.name, message: t }) }); if (!r.ok) throw 0; };
    }
  }
  Roles.load().catch(() => {}).then(start);                    // primero los roles, luego los mensajes
  setInterval(() => Roles.load().then(repaint).catch(() => {}), 30000);

  let last = 0;
  form.addEventListener('submit', async e => {
    e.preventDefault(); const t = text.value.trim(); if (!t || !send || Date.now() - last < 1200) return; last = Date.now(); text.value = '';
    try { await send(t); localStorage.setItem('nova-msgs', (+localStorage.getItem('nova-msgs') || 0) + 1); }
    catch (x) { down(x.message === 'banned' ? 'Tu cuenta está bloqueada.' : x.message === 'muted' ? 'Tu cuenta está silenciada temporalmente.' : 'No se pudo enviar. Revisa tu conexión.'); }
  });
})();
