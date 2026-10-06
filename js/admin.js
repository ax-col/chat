(() => {
  const me = Me.get(); if (!me) return;
  const A = NOVA.auth || {}, base = (NOVA.db.url || '').replace(/\/$/, ''), $ = id => document.getElementById(id);
  const mine = $('myrole');
  if (mine) Roles.load().catch(() => {}).then(() => mine.append(Roles.badge(Roles.of(me.name))));

  const btn = $('adminBtn');
  if (!btn || !A.apiKey || !Store.online || !(A.staff || []).map(s => s.toLowerCase()).includes(me.name.toLowerCase())) return;
  btn.hidden = false;

  const getTok = () => { try { const s = JSON.parse(sessionStorage.getItem('nova-admin')); return s && s.exp > Date.now() ? s.t : null; } catch { return null; } };
  async function login(pw) {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${A.apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `${me.name.toLowerCase()}@nova-admin.app`, password: pw, returnSecureToken: true })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(String(j.error && j.error.message || '').startsWith('TOO_MANY') ? 'many' : r.status === 400 ? 'bad' : 'net');
    sessionStorage.setItem('nova-admin', JSON.stringify({ t: j.idToken, exp: Date.now() + 3300e3 }));
  }
  async function setRole(name, role) {
    const t = getTok(); if (!t) throw new Error('auth');
    const k = name.toLowerCase(), url = `${base}/roles/${k}.json?auth=${encodeURIComponent(t)}`;
    const r = await fetch(url, role === 'USER' ? { method: 'DELETE' } : { method: 'PUT', body: JSON.stringify(role) });
    if (r.status === 401 || r.status === 403) throw new Error('auth');
    if (!r.ok) throw new Error('net');
    if (role === 'USER') delete Roles.map[k]; else Roles.map[k] = role;
  }

  const modal = document.createElement('div'); modal.className = 'modal'; modal.hidden = true;
  modal.innerHTML = '<div class="sheet rgb" role="dialog" aria-modal="true" aria-label="Panel de roles"><div class="sheet-top"><b>Panel de roles</b><button type="button" class="x" aria-label="Cerrar">×</button></div><div class="sheet-body"></div></div>';
  document.body.append(modal);
  const body = modal.querySelector('.sheet-body'); let status;
  modal.querySelector('.x').onclick = () => modal.hidden = true;
  modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });
  btn.onclick = () => { modal.hidden = false; getTok() ? panel() : loginView(); };

  function loginView() {
    body.innerHTML = '<p class="muted" style="margin:0">Acceso de administrador para <b></b></p><input class="in" type="password" id="apw" placeholder="Contraseña" autocomplete="current-password"><button class="btn main" type="button" id="alog">Entrar</button><p class="err" id="amsg"></p>';
    body.querySelector('b').textContent = '@' + me.name;
    const pw = $('apw'), msg = $('amsg'), go = $('alog');
    const run = async () => {
      if (!pw.value) return; go.disabled = true; msg.textContent = '';
      try { await login(pw.value); pw.value = ''; panel(); }
      catch (e) { msg.textContent = e.message === 'bad' ? 'Contraseña incorrecta, o la cuenta no existe en Firebase Authentication.' : e.message === 'many' ? 'Demasiados intentos. Espera unos minutos.' : 'No se pudo conectar. Intenta de nuevo.'; go.disabled = false; }
    };
    go.onclick = run; pw.addEventListener('keydown', e => { if (e.key === 'Enter') run(); }); pw.focus();
  }

  async function panel() {
    body.textContent = 'Cargando…';
    let users;
    try { users = await Store.all(); await Roles.load(); } catch { body.textContent = 'No se pudo cargar la lista de usuarios.'; return; }
    users.sort((a, b) => a.name.localeCompare(b.name));
    body.innerHTML = '';
    const q = document.createElement('input'); q.className = 'in'; q.placeholder = 'Buscar usuario'; q.setAttribute('aria-label', 'Buscar usuario');
    status = document.createElement('p'); status.className = 'hint';
    const ul = document.createElement('ul'); ul.className = 'ulist'; body.append(q, status, ul);
    const render = () => {
      const f = q.value.trim().toLowerCase(), rows = users.filter(u => u.name.toLowerCase().includes(f));
      ul.replaceChildren(...rows.map(row)); status.textContent = `${rows.length} de ${users.length} usuarios`;
    };
    q.oninput = render; render();
  }

  function row(u) {
    const li = document.createElement('li'); li.className = 'urow';
    const av = document.createElement('span'); av.className = 'mini-av';
    if (u.photo && u.photo.startsWith('data:image/')) { const im = new Image(); im.src = u.photo; im.alt = ''; av.append(im); } else av.textContent = u.name[0].toUpperCase();
    const mid = document.createElement('div'), n = document.createElement('b'), p = document.createElement('small'), slot = document.createElement('div');
    n.textContent = '@' + u.name; p.textContent = u.place || ''; mid.append(n, p, slot);
    const paint = () => slot.replaceChildren(Roles.badge(Roles.of(u.name))); paint();
    const sel = document.createElement('select'); sel.className = 'in sel'; sel.setAttribute('aria-label', 'Rol de ' + u.name);
    Roles.list.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r; sel.append(o); }); sel.value = Roles.of(u.name);
    sel.onchange = async () => {
      sel.disabled = true;
      try { await setRole(u.name, sel.value); paint(); status.textContent = `@${u.name} ahora es ${sel.value}`; }
      catch (e) {
        sel.value = Roles.of(u.name);
        if (e.message === 'auth') { sessionStorage.removeItem('nova-admin'); loginView(); $('amsg').textContent = 'Sin permiso. Inicia sesión de nuevo o revisa el UID en las reglas.'; }
        else status.textContent = 'No se pudo guardar. Intenta de nuevo.';
      }
      sel.disabled = false;
    };
    li.append(av, mid, sel); return li;
  }
})();
