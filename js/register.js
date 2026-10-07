(() => {
  const $ = id => document.getElementById(id), form = $('account-form'), name = $('user'), password = $('password'), password2 = $('password2'), remember = $('remember'), mode = $('mode'), submit = $('go'), err = $('err'), title = $('account-title'), hint = $('account-hint'), toggle = $('toggle-mode'), picker = $('picker');
  if (Me.get() && Auth.uid()) { location.replace('pages/chat.html'); return; }
  let registering = true, loc = null;
  const show = () => { registering = mode.value === 'register'; title.textContent = registering ? 'Crea tu cuenta' : 'Inicia sesión'; hint.textContent = registering ? 'Regístrate una vez y tu acceso seguirá funcionando aunque publiques nuevas versiones.' : 'Entra con tu usuario y contraseña desde cualquier dispositivo.'; submit.textContent = registering ? 'Registrarme y entrar' : 'Entrar'; password2.hidden = !registering; password2.required = registering; picker.hidden = !registering; toggle.textContent = registering ? 'Ya tengo una cuenta · Iniciar sesión' : 'No tengo cuenta · Registrarme'; err.textContent = ''; };
  Geo.picker(picker, p => loc = p); mode.onchange = show; toggle.onclick = () => { mode.value = registering ? 'login' : 'register'; show(); };
  form.addEventListener('submit', async e => {
    e.preventDefault(); const n = name.value.trim();
    if (!/^[a-z0-9_]{3,16}$/i.test(n)) return err.textContent = 'Usa de 3 a 16 caracteres: letras, números o _.';
    if (password.value.length < 6) return err.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    if (registering && password.value !== password2.value) return err.textContent = 'Las contraseñas no coinciden.';
    if (registering && !loc) return err.textContent = 'Agrega tu ubicación para aparecer en el mapa.';
    err.textContent = ''; submit.disabled = true; submit.textContent = registering ? 'Registrando…' : 'Entrando…';
    try {
      if (registering) { const exists = await Store.get(n); if (exists) throw new Error('taken'); await Auth.register(n, password.value, remember.checked); const user = { name: n, ...loc, photo: '', joined: Date.now(), uid: Auth.uid() }; await Store.claim(user); Me.set(user); }
      else { await Auth.login(n, password.value, remember.checked); let user = await Store.get(n); const owner = String(n).toLowerCase() === 'ax_co' && String((NOVA.auth.emails || {}).ax_co || '').toLowerCase() === Auth.emailFor(n).toLowerCase(); if (!user) { Auth.clear(); throw new Error('NO_PROFILE'); } if (user.uid !== Auth.uid()) { if (!owner) { Auth.clear(); throw new Error('NO_PROFILE'); } user = { ...user, uid: Auth.uid() }; await Store.update(user); } Me.set(user); }
      location.href = 'pages/chat.html';
    } catch (x) { const m = String(x.message || x); err.textContent = m === 'taken' ? 'Ese usuario ya existe. Inicia sesión.' : m === 'NO_PROFILE' ? 'La cuenta existe, pero no tiene perfil en la base de datos.' : Auth.friendly(m); submit.disabled = false; show(); }
  });
  if (Store.online && !Auth.ready) { $('demo').hidden = false; $('demo').textContent = 'Falta la apiKey de Firebase en js/config.js.'; }
  if (Store.online && Auth.ready) Store.ping().catch(() => { $('demo').hidden = false; $('demo').textContent = 'No se pudo conectar con Firebase. Revisa la URL y las reglas.'; });
  show();
})();
