(() => {
  const $ = id => document.getElementById(id), form = $('account-form'), name = $('user'), password = $('password'), remember = $('remember'), mode = $('mode'), submit = $('go'), err = $('err'), title = $('account-title'), hint = $('account-hint'), picker = $('picker'), box = $('password-box'), guestBtn = $('guest-mode'), staffBtn = $('staff-mode');
  if (Me.get() && Auth.uid()) { location.replace('pages/chat.html'); return; }
  let loc = null;
  const setMode = value => {
    const staff = value === 'staff'; mode.value = value; title.textContent = staff ? 'Entrar a Staff' : 'Entrar como invitado'; hint.textContent = staff ? 'Usa tu usuario y contraseña administrativa.' : 'Solo necesitas un nombre de usuario y tu ubicación.'; submit.textContent = staff ? 'Entrar a Staff' : 'Entrar como invitado'; box.hidden = !staff; password.required = staff; picker.hidden = staff; guestBtn.classList.toggle('active', !staff); staffBtn.classList.toggle('active', staff); err.textContent = '';
  };
  Geo.picker(picker, p => loc = p); guestBtn.onclick = () => setMode('guest'); staffBtn.onclick = () => setMode('staff');
  form.addEventListener('submit', async e => {
    e.preventDefault(); const n = name.value.trim(), action = mode.value, current = Auth.session();
    if (!/^[a-z0-9_]{3,16}$/i.test(n)) return err.textContent = 'Usa de 3 a 16 caracteres: letras, números o _.';
    if (action === 'guest' && !loc) return err.textContent = 'Agrega tu ubicación para entrar como invitado.';
    if (action === 'staff' && password.value.length < 6) return err.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    err.textContent = ''; submit.disabled = true; submit.textContent = 'Comprobando…';
    try {
      const existing = await Store.get(n);
      if (action === 'guest') {
        await Auth.guest(remember.checked);
        if (existing && existing.uid !== Auth.uid()) { Auth.clear(); throw new Error('TAKEN_OTHER'); }
        const user = existing || { name: n, ...loc, photo: '', joined: Date.now(), uid: Auth.uid() };
        if (!existing) await Store.claim(user); else await Store.update({ ...existing, ...loc });
        Me.set(user); location.href = 'pages/chat.html'; return;
      }
      const anonymousCurrent = current && current.anon && existing && current.uid === existing.uid;
      if (anonymousCurrent) await Auth.link(n, password.value, remember.checked); else await Auth.login(n, password.value, remember.checked);
      let user = await Store.get(n); const owner = String(n).toLowerCase() === 'ax_co' && String((NOVA.auth.emails || {}).ax_co || '').toLowerCase() === Auth.emailFor(n).toLowerCase();
      if (!user) { Auth.clear(); throw new Error('NO_PROFILE'); }
      if (user.uid !== Auth.uid()) { if (!owner) { Auth.clear(); throw new Error('NO_PROFILE'); } user = { ...user, uid: Auth.uid() }; await Store.update(user); }
      await Roles.load();
      if (Roles.of(n) === 'USER') { Auth.clear(); throw new Error('NO_ROLE'); }
      const staffRole = Roles.of(n), staffToken = await Auth.token();
      sessionStorage.setItem('nova-staff', JSON.stringify({ t: staffToken, uid: Auth.uid(), role: staffRole, name: n, exp: Date.now() + 3300e3 }));
      Me.set(user); location.href = 'pages/chat.html?staff=1';
    } catch (x) {
      const m = String(x.message || x); err.textContent = m === 'TAKEN_OTHER' ? 'Ese usuario ya existe en otra sesión. Usa el mismo dispositivo o entra a Staff con contraseña.' : m === 'NO_PROFILE' ? 'La cuenta existe, pero no tiene perfil en la base de datos.' : m === 'NO_ROLE' ? 'Esta cuenta no tiene un rol administrativo.' : Auth.friendly(m); submit.disabled = false; setMode(action);
    }
  });
  if (Store.online && !Auth.ready) { $('demo').hidden = false; $('demo').textContent = 'Falta la apiKey de Firebase en js/config.js.'; }
  if (Store.online && Auth.ready) Store.ping().catch(() => { $('demo').hidden = false; $('demo').textContent = 'No se pudo conectar con Firebase. Revisa la URL y las reglas.'; });
  setMode('guest');
})();
