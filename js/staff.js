// Staff (MOD / ADMIN / OWNER): inicio de sesión con contraseña real (Firebase Authentication) y panel por nivel.
// MOD: ver y borrar mensajes de un usuario · ADMIN: + ver cuentas, posiciones y roles · OWNER: + roles, contraseñas, número de cuenta y borrar cuentas.
(() => {
  const me = Me.get(); if (!me) return;
  const $ = id => document.getElementById(id), A = NOVA.auth || {}, base = (NOVA.db.url || '').replace(/\/$/, ''), enc = encodeURIComponent;
  const LV = { MOD: 1, ADMIN: 2, OWNER: 3 }, SK = 'nova-staff', IDT = 'https://identitytoolkit.googleapis.com/v1/accounts';
  const sess = () => { try { const s = JSON.parse(sessionStorage.getItem(SK)); return s && s.exp > Date.now() && s.name === me.name ? s : null; } catch { return null; } };
  const level = () => (sess() ? LV[sess().role] || 0 : 0);
  const fire = () => dispatchEvent(new Event('staff-change'));
  async function api(m, path, body) {
    const s = sess(); if (!s) throw new Error('auth');
    const r = await fetch(`${base}/${path}.json?auth=${enc(s.t)}`, { method: m, body: body === undefined ? undefined : JSON.stringify(body) });
    if (r.status === 401 || r.status === 403) throw new Error('auth'); if (!r.ok) throw new Error('net');
    return r.json().catch(() => null);
  }
  async function audit(action, target, detail) { try { await api('POST', 'audit', { actor: me.name, action, target: target || '', detail: detail || '', ts: { '.sv': 'timestamp' } }); } catch {} }
  window.Staff = { level, role: () => (sess() || {}).role || null, deleteMessage: async id => { await api('DELETE', 'messages/' + id); await audit('delete_message', id, 'Mensaje eliminado desde el panel'); } };

  const mine = $('myrole');
  if (mine) Roles.load().catch(() => {}).then(() => mine.append(Roles.badge(Roles.of(me.name))));
  const btns = [...document.querySelectorAll('[data-staff]')];
  if (!btns.length || !A.apiKey || !Store.online) return;
  Roles.load().catch(() => {}).then(() => { if (Roles.of(me.name) !== 'USER') btns.forEach(b => b.hidden = false); });

  async function login(pw) {
    const remember = !!localStorage.getItem('nova-auth-local');
    let j;
    const anonymous = Auth.isAnonymous() && Auth.uid() === me.uid;
    if (anonymous && pw.length < 6) throw new Error('weak');
    try { j = anonymous ? await Auth.link(me.name, pw, remember) : await Auth.login(me.name, pw, remember); } catch (e) {
      const code = String(e.message || '');
      throw new Error(code.startsWith('TOO_MANY') ? 'many' : /INVALID|NOT_FOUND|PASSWORD/.test(code) ? 'bad' : 'net');
    }
    let role = Roles.fixed(me.name) ? 'OWNER' : null;
    if (!role) { const x = await fetch(`${base}/staff/${j.localId}.json?auth=${enc(j.idToken)}`); role = x.ok ? await x.json() : null; }
    if (!LV[role]) throw new Error('norole');
    sessionStorage.setItem(SK, JSON.stringify({ t: j.idToken, uid: j.localId, role, name: me.name, exp: Date.now() + 3300e3 }));
    fire();
  }

  // ---------- ventana ----------
  const modal = document.createElement('div'); modal.className = 'modal'; modal.hidden = true;
  modal.innerHTML = '<div class="sheet rgb" role="dialog" aria-modal="true" aria-label="Panel de staff"><div class="sheet-top"><b>Panel de staff</b><button type="button" class="x" aria-label="Cerrar">×</button></div><div class="sheet-body"></div></div>';
  document.body.append(modal);
  const body = modal.querySelector('.sheet-body');
  modal.querySelector('.x').onclick = () => modal.hidden = true;
  modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  btns.forEach(b => b.onclick = () => { modal.hidden = false; sess() ? home() : loginView(); });
  if (new URLSearchParams(location.search).get('staff') === '1') setTimeout(() => btns[0] && btns[0].click(), 80);
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const relog = msg => { sessionStorage.removeItem(SK); fire(); loginView(msg); };

  function loginView(note) {
    const creating = Auth.isAnonymous() && Auth.uid() === me.uid;
    body.innerHTML = `<p class="muted" style="margin:0">${creating ? 'Esta cuenta antigua tiene rol de staff, pero todavía no tiene contraseña. Crea una para activar la consola.' : 'Acceso de staff para <b></b>. Usa la contraseña de tu cuenta.'}</p><input class="in" type="password" id="apw" placeholder="${creating ? 'Nueva contraseña (mínimo 6)' : 'Contraseña'}" autocomplete="${creating ? 'new-password' : 'current-password'}"><button class="btn main" type="button" id="alog">${creating ? 'Crear contraseña y entrar' : 'Entrar'}</button><p class="err" id="amsg"></p>`;
    body.querySelector('b').textContent = '@' + me.name; $('amsg').textContent = note || '';
    const pw = $('apw'), go = $('alog');
    const run = async () => {
      if (!pw.value) return; go.disabled = true; $('amsg').textContent = '';
      try { await login(pw.value); pw.value = ''; home(); }
      catch (e) { $('amsg').textContent = { bad: 'Contraseña incorrecta.', many: 'Demasiados intentos. Espera unos minutos.', weak: 'La contraseña debe tener mínimo 6 caracteres.', norole: 'Tu cuenta no tiene un rol de staff activo.' }[e.message] || 'No se pudo conectar. Intenta de nuevo.'; go.disabled = false; }
    };
    go.onclick = run; pw.addEventListener('keydown', e => { if (e.key === 'Enter') run(); }); pw.focus();
  }

  function home(tab) {
    const tabs = []; if (level() >= 2) tabs.push(['users', 'Usuarios']); tabs.push(['reports', 'Reportes'], ['msgs', 'Mensajes']); if (level() >= 2) tabs.push(['audit', 'Historial']); tabs.push(['me', 'Cuenta']);
    tab = tab || tabs[0][0]; body.innerHTML = '';
    const bar = el('div', 'tabs'); tabs.forEach(([k, l]) => { const b = el('button', 'tab' + (k === tab ? ' on' : ''), l); b.type = 'button'; b.onclick = () => home(k); bar.append(b); });
    const pane = el('div', 'pane'); body.append(bar, pane);
    ({ users: usersTab, reports: reportsTab, msgs: msgsTab, audit: auditTab, me: meTab })[tab](pane);
  }

  // ---------- Usuarios (ADMIN+; OWNER edita) ----------
  async function usersTab(pane, note) {
    pane.textContent = 'Cargando…'; let users;
    try { users = await Store.all(); await Roles.load(); } catch { pane.textContent = 'No se pudo cargar la lista.'; return; }
    users.sort((a, b) => a.joined - b.joined);
    const owner = level() >= 3, rootLike = Roles.fixed(me.name); let only = false;
    pane.innerHTML = '';
    const q = el('input', 'in'); q.placeholder = 'Buscar usuario'; q.setAttribute('aria-label', 'Buscar usuario');
    const tog = el('button', 'btn', 'Solo staff'); tog.type = 'button'; tog.style.setProperty('--c', '#d500f9');
    const top = el('div', 'loc'); q.classList.add('q'); top.append(q, tog);
    const status = el('p', 'hint', note || ''), ul = el('ul', 'ulist'); pane.append(top, status, ul);
    const reload = msg => usersTab(pane, msg);
    const fail = e => { if (e.message === 'auth') relog('Sin permiso. Inicia sesión de nuevo.'); else status.textContent = { weak: 'La contraseña debe tener mínimo 6 caracteres.' }[e.message] || 'No se pudo completar. Intenta de nuevo.'; };

    const row = (u, n) => {
      const li = el('li', 'urow'), av = el('span', 'mini-av');
      if (u.photo && u.photo.startsWith('data:image/')) { const im = new Image(); im.src = u.photo; im.alt = ''; av.append(im); } else av.textContent = u.name[0].toUpperCase();
      const mid = el('div'), slot = el('div'); mid.append(el('b', '', `#${n} @${u.name}`), el('small', '', u.place || ''), slot);
      slot.append(Roles.badge(Roles.of(u.name))); li.append(av, mid);
      if (owner && !Roles.fixed(u.name)) {
        const ctl = el('div', 'ctl'), sel = el('select', 'in sel'); sel.setAttribute('aria-label', 'Rol de ' + u.name);
        (rootLike ? Roles.list : ['ADMIN', 'MOD', 'USER']).forEach(r => { const o = el('option', '', r); o.value = r; sel.append(o); }); sel.value = Roles.of(u.name);
        sel.onchange = async () => { sel.disabled = true; try { reload(await setRole(u, sel.value)); } catch (e) { sel.value = Roles.of(u.name); sel.disabled = false; fail(e); } };
        const num = el('button', 'btn', 'Nº'); num.type = 'button'; num.style.setProperty('--c', '#2979ff'); num.title = 'Cambiar número de cuenta';
        num.onclick = async () => {
          const v = parseInt(prompt(`Nuevo número de cuenta para @${u.name} (1 a ${users.length}):`, String(n)), 10); if (!v) return;
          const others = users.filter(x => x !== u), k = Math.max(1, Math.min(v, others.length + 1));
          const joined = k === 1 ? others[0].joined - 1000 : k > others.length ? others[others.length - 1].joined + 1000 : Math.floor((others[k - 2].joined + others[k - 1].joined) / 2);
          try { await api('PUT', `users/${Store.key(u.name)}/joined`, joined); reload(`@${u.name} ahora es la cuenta #${k}.`); } catch (e) { fail(e); }
        };
        ctl.append(sel, num);
        if (u.name !== me.name) {
          const del = el('button', 'btn danger', 'Eliminar'); del.type = 'button';
          del.onclick = async () => {
            if (!confirm(`¿Eliminar la cuenta de @${u.name}? Esta acción no se puede deshacer.`)) return;
            try { const k = Store.key(u.name); await api('DELETE', 'users/' + k); await api('DELETE', 'roles/' + k).catch(() => {}); if (u.uid) await api('DELETE', 'staff/' + u.uid).catch(() => {}); await audit('delete_user', u.name, 'Cuenta eliminada'); reload(`Cuenta de @${u.name} eliminada.`); } catch (e) { fail(e); }
          };
          ctl.append(del);
        }
        li.append(ctl);
      }
      return li;
    };
    const render = () => {
      const f = q.value.trim().toLowerCase(), rows = users.map((u, i) => [u, i + 1]).filter(([u]) => u.name.toLowerCase().includes(f) && (!only || Roles.of(u.name) !== 'USER'));
      ul.replaceChildren(...rows.map(([u, n]) => row(u, n)));
      if (!note || q.value || only) status.textContent = `${rows.length} de ${users.length} usuarios`; note = '';
    };
    q.oninput = render; tog.onclick = () => { only = !only; tog.classList.toggle('on', only); render(); }; render();
  }

  async function setRole(u, role) {
    const k = Store.key(u.name), uid = u.uid;
    if (!uid) throw new Error('auth');
    if (role === 'USER') { await api('DELETE', 'roles/' + k); await api('DELETE', 'staff/' + uid).catch(() => {}); delete Roles.map[k]; await audit('change_role', u.name, 'USER'); return `@${u.name} ahora es USER.`; }
    await api('PUT', 'staff/' + uid, role); await api('PUT', 'roles/' + k, role); Roles.map[k] = role;
    await audit('change_role', u.name, role);
    return `@${u.name} ahora es ${role}. Usará la misma contraseña con la que se registró.`;
  }

  // ---------- Reportes y sanciones (MOD+) ----------
  async function reportsTab(pane, note) {
    pane.textContent = 'Cargando…'; let reports = {};
    try { reports = await api('GET', 'reports') || {}; } catch { pane.textContent = 'No se pudieron cargar los reportes.'; return; }
    pane.innerHTML = ''; const status = el('p', 'hint', note || ''), ul = el('ul', 'ulist'); pane.append(status, ul);
    const open = Object.entries(reports).filter(([, r]) => !r || r.status !== 'resolved').sort((a, b) => (b[1].ts || 0) - (a[1].ts || 0));
    if (!open.length) { status.textContent = note || 'No hay reportes pendientes.'; return; }
    open.forEach(([id, r]) => {
      const li = el('li', 'urow'), info = el('div'); info.append(el('b', '', `@${r.n || 'usuario'} · ${r.reason || 'Sin motivo'}`), el('small', '', `Reportó @${r.reporterName || 'usuario'} · ${r.ts ? new Date(r.ts).toLocaleString() : 'ahora'}`));
      const ctl = el('div', 'ctl');
      const mute = el('button', 'btn', 'Silenciar'); mute.type = 'button'; mute.style.setProperty('--c', '#ffd600');
      const ban = el('button', 'btn danger', 'Bloquear'); ban.type = 'button';
      const del = el('button', 'btn danger', 'Borrar mensaje'); del.type = 'button';
      const done = el('button', 'btn', 'Resolver'); done.type = 'button'; done.style.setProperty('--c', '#00c853');
      const finish = async (msg, action) => { await api('PATCH', 'reports/' + id, { status: 'resolved', resolvedBy: me.name, resolution: msg, resolvedAt: { '.sv': 'timestamp' } }); await audit(action || 'resolve_report', r.n, msg); reportsTab(pane, msg); };
      mute.onclick = async () => { const min = Math.max(1, parseInt(prompt('¿Cuántos minutos de silencio?', '60'), 10) || 0); if (!min) return; try { await api('PUT', 'sanctions/' + Store.key(r.n), { type: 'mute', until: Date.now() + min * 60000, reason: r.reason || '', by: me.name, ts: { '.sv': 'timestamp' } }); await finish(`@${r.n} silenciado ${min} minutos.`, 'mute_user'); } catch (e) { status.textContent = 'No se pudo aplicar el silencio.'; } };
      ban.onclick = async () => { if (!confirm(`¿Bloquear a @${r.n}?`)) return; try { await api('PUT', 'sanctions/' + Store.key(r.n), { type: 'ban', until: 0, reason: r.reason || '', by: me.name, ts: { '.sv': 'timestamp' } }); await finish(`@${r.n} bloqueado.`, 'ban_user'); } catch { status.textContent = 'No se pudo bloquear.'; } };
      del.onclick = async () => { try { await Staff.deleteMessage(r.messageId); await finish(`Mensaje de @${r.n} eliminado.`, 'delete_reported_message'); } catch { status.textContent = 'No se pudo eliminar el mensaje.'; } };
      done.onclick = () => finish('Reporte revisado sin sanción.', 'resolve_report').catch(() => { status.textContent = 'No se pudo resolver.'; });
      ctl.append(mute, ban, del, done); li.append(info, ctl); ul.append(li);
    });
  }

  async function auditTab(pane) {
    pane.textContent = 'Cargando…'; let rows = {};
    try { rows = await api('GET', 'audit') || {}; } catch { pane.textContent = 'No se pudo cargar el historial.'; return; }
    pane.innerHTML = ''; const ul = el('ul', 'ulist'); pane.append(el('p', 'hint', 'Últimas acciones administrativas'), ul);
    Object.values(rows).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 100).forEach(x => { const li = el('li', 'urow'), d = x.ts ? new Date(x.ts).toLocaleString() : ''; li.append(el('b', '', `${x.actor || 'sistema'} · ${x.action || 'acción'}`), el('small', '', `${x.target || ''} ${x.detail || ''} · ${d}`)); ul.append(li); });
  }

  // ---------- Mensajes de un usuario (MOD+) ----------
  async function msgsTab(pane) {
    pane.innerHTML = ''; let users = []; try { users = await Store.all(); } catch {}
    const q = el('input', 'in'); q.placeholder = 'Usuario (ej. luna_77)'; q.setAttribute('list', 'nova-users-dl'); q.setAttribute('aria-label', 'Usuario');
    const dl = el('datalist'); dl.id = 'nova-users-dl'; users.forEach(u => { const o = el('option'); o.value = u.name; dl.append(o); });
    const go = el('button', 'btn main', 'Ver mensajes'); go.type = 'button';
    const status = el('p', 'hint'), ul = el('ul', 'ulist'); pane.append(q, dl, go, status, ul);
    const run = async () => {
      const raw = q.value.trim(); if (!raw) return; const name = (users.find(u => u.name.toLowerCase() === raw.toLowerCase()) || { name: raw }).name;
      status.textContent = 'Buscando…'; ul.replaceChildren();
      try {
        const r = await fetch(`${base}/messages.json?orderBy=${enc('"n"')}&equalTo=${enc(JSON.stringify(name))}&limitToLast=50`);
        if (!r.ok) throw 0; const rows = Object.entries(await r.json() || {}).sort((a, b) => a[1].ts - b[1].ts);
        status.textContent = rows.length ? `${rows.length} mensajes de @${name} (últimos 50)` : `@${name} no tiene mensajes.`;
        rows.forEach(([id, m]) => {
          const li = el('li', 'urow msgrow'), txt = el('div'); txt.append(el('small', '', new Date(m.ts).toLocaleString()), el('span', '', m.t));
          const d = el('button', 'btn danger', 'Borrar'); d.type = 'button';
          d.onclick = async () => { try { await Staff.deleteMessage(id); li.remove(); status.textContent = 'Mensaje borrado.'; } catch (e) { if (e.message === 'auth') relog('Sin permiso. Inicia sesión de nuevo.'); else status.textContent = 'No se pudo borrar.'; } };
          li.append(txt, d); ul.append(li);
        });
      } catch { status.textContent = 'No se pudo buscar. Revisa que las reglas tengan .indexOn en messages.'; }
    };
    go.onclick = run; q.addEventListener('keydown', e => { if (e.key === 'Enter') run(); });
  }

  // ---------- Mi cuenta de staff ----------
  function meTab(pane) {
    pane.innerHTML = ''; const s = sess();
    const row1 = el('div', 'who'); row1.append(el('b', '', '@' + me.name), Roles.badge(s.role));
    const pw = el('input', 'in'); pw.type = 'password'; pw.placeholder = 'Nueva contraseña (mínimo 8)'; pw.autocomplete = 'new-password';
    const save = el('button', 'btn main', 'Cambiar mi contraseña'); save.type = 'button';
    const out = el('button', 'btn danger', 'Cerrar sesión de staff'); out.type = 'button'; const st = el('p', 'hint');
    save.onclick = async () => {
      if (pw.value.length < 6) { st.textContent = 'Mínimo 6 caracteres.'; return; }
      const r = await fetch(`${IDT}:update?key=${A.apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: s.t, password: pw.value, returnSecureToken: false }) });
      st.textContent = r.ok ? 'Contraseña actualizada.' : 'No se pudo cambiar. Cierra sesión y entra de nuevo.'; if (r.ok) pw.value = '';
    };
    out.onclick = () => { sessionStorage.removeItem(SK); fire(); modal.hidden = true; };
    pane.append(row1, pw, save, st, out);
  }
})();
