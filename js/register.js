(() => {
  if (Me.get()) { location.replace('pages/chat.html'); return; }
  const f = document.getElementById('reg'), u = document.getElementById('user'), err = document.getElementById('err'), btn = document.getElementById('go');
  let loc = null;
  const demo = document.getElementById('demo');
  if (!Store.online) demo.hidden = false;
  else Store.ping().catch(() => { demo.textContent = 'No se pudo conectar con la base de datos. Revisa la URL en js/config.js y las reglas de Firebase.'; demo.hidden = false; });
  Geo.picker(document.getElementById('picker'), p => loc = p);
  f.addEventListener('submit', async e => {
    e.preventDefault(); const name = u.value.trim();
    if (!/^[a-z0-9_]{3,16}$/i.test(name)) return err.textContent = 'Usa de 3 a 16 caracteres: letras, números o _.';
    if (!loc) return err.textContent = 'Agrega tu ubicación para aparecer en el mapa.';
    err.textContent = ''; btn.disabled = true; btn.textContent = 'Registrando…';
    const user = { name, ...loc, photo: '', joined: Date.now() };
    try { await Store.claim(user); Me.set(user); location.href = 'pages/chat.html'; }
    catch (x) { err.textContent = x.message === 'taken' ? 'Ese usuario ya existe. Elige otro.' : 'No se pudo conectar. Intenta de nuevo.'; btn.disabled = false; btn.textContent = 'Registrarme y entrar'; }
  });
})();
