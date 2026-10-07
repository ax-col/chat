(() => {
  const $ = id => document.getElementById(id), form = $('account-form'), name = $('user'), password = $('password'), remember = $('remember'), mode = $('mode'), submit = $('go'), err = $('err'), title = $('account-title'), hint = $('account-hint'), picker = $('picker'), guestBtn = $('guest-mode'), staffBtn = $('staff-mode');
  const current = Auth.session();
  if (Me.get() && Auth.uid() && !Auth.isAnonymous()) { location.replace('pages/chat.html'); return; }
  let loc = null;
  const setMode = value => {
    const staff = value === 'staff'; mode.value = value; title.textContent = staff ? 'Entrar a Staff' : 'Entrar como invitado'; hint.textContent = staff ? 'Usa el mismo usuario y contraseña con que creaste tu cuenta.' : 'Crea o usa tu cuenta con usuario, contraseña y ubicación.'; submit.textContent = staff ? 'Entrar a Staff' : 'Entrar como invitado'; password.placeholder = staff ? 'Contraseña de tu cuenta' : 'Mínimo 6 caracteres'; picker.hidden = staff; guestBtn.classList.toggle('active', !staff); staffBtn.classList.toggle('active', staff); err.textContent = '';
  };
  Geo.picker(picker, p => loc = p); guestBtn.onclick = () => setMode('guest'); staffBtn.onclick = () => setMode('staff');
  form.addEventListener('submit', async e => {
    e.preventDefault(); const n = name.value.trim(), action = mode.value, old = Auth.session();
    if (!/^[a-z0-9_]{3,16}$/i.test(n)) return err.textContent = 'Usa de 3 a 16 caracteres: letras, números o _.';
    if (password.value.length < 6) return err.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    if (action === 'guest' && !loc) return err.textContent = 'Agrega tu ubicación para entrar al chat.';
    err.textContent = ''; submit.disabled = true; submit.textContent = 'Comprobando…';
    try {
      const existing = await Store.get(n); let user;
      if (action === 'guest') {
        if (existing) {
          await Auth.login(n, password.value, remember.checked); user = await Store.get(n);
          if (!user || user.uid !== Auth.uid()) { Auth.clear(); throw new Error('NO_PROFILE'); }
          user = { ...user, ...loc }; await Store.update(user);
        } else {
          await Auth.register(n, password.value, remember.checked); user = { name: n, ...loc, photo: '', joined: Date.now(), uid: Auth.uid() }; await Store.claim(user);
        }
        Me.set(user); location.href = 'pages/chat.html'; return;
      }
      await Auth.login(n, password.value, remember.checked); user = await Store.get(n);
      const owner = String(n).toLowerCase() === 'ax_co' && String((NOVA.auth.emails || {}).ax_co || '').toLowerCase() === Auth.emailFor(n).toLowerCase();
      if (!user) { Auth.clear(); throw new Error('NO_PROFILE'); }
      if (user.uid !== Auth.uid()) { if (!owner) { Auth.clear(); throw new Error('NO_PROFILE'); } user = { ...user, uid: Auth.uid() }; await Store.update(user); }
      await Roles.load(); if (Roles.of(n) === 'USER') { Auth.clear(); throw new Error('NO_ROLE'); }
      Me.set(user); location.href = 'pages/chat.html?staff=1';
    } catch (x) {
      const m = String(x.message || x); err.textContent = m === 'EMAIL_EXISTS' ? 'Ese usuario ya tiene una cuenta. Usa su contraseña.' : m === 'NO_PROFILE' ? 'La cuenta no coincide con este perfil.' : m === 'NO_ROLE' ? 'Esta cuenta no tiene un rol administrativo.' : m === 'INVALID_EMAIL' ? 'El usuario no puede convertirse en correo interno. Usa otro nombre.' : Auth.friendly(m); submit.disabled = false; setMode(action);
    }
  });
  if (Store.online && !Auth.ready) { $('demo').hidden = false; $('demo').textContent = 'Falta la apiKey de Firebase en js/config.js.'; }
  if (Store.online && Auth.ready) Store.ping().catch(() => { $('demo').hidden = false; $('demo').textContent = 'No se pudo conectar con Firebase. Revisa la URL y las reglas.'; });
  setMode('guest');
})();
