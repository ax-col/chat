(() => {
  let me = Me.get(); if (!me) return;
  const $ = id => document.getElementById(id), VALID = /^[a-z0-9_]{3,16}$/i;
  let photo = me.photo || '', loc = null;
  const msg = (t, ok) => { $('msg').textContent = t; $('msg').className = ok ? 'ok' : 'err'; };
  function avatar() { const a = $('avatar'); a.innerHTML = ''; if (photo) { const i = document.createElement('img'); i.src = photo; i.alt = 'Tu foto'; a.append(i); } else a.textContent = me.name[0].toUpperCase(); }
  function resize(file) { return new Promise(ok => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 128; const s = Math.min(i.width, i.height); c.getContext('2d').drawImage(i, (i.width - s) / 2, (i.height - s) / 2, s, s, 0, 0, 128, 128); ok(c.toDataURL('image/jpeg', .8)); }; i.src = URL.createObjectURL(file); }); }
  $('avatar').onclick = () => $('file').click();
  $('file').onchange = async e => { if (e.target.files[0]) { photo = await resize(e.target.files[0]); avatar(); msg('Foto lista. Pulsa Guardar cambios.', true); } };
  $('name').value = me.name; avatar();
  Geo.picker($('picker'), p => loc = p, me.place);

  $('save').onclick = async () => {
    const name = $('name').value.trim();
    if (!VALID.test(name)) return msg('Usa de 3 a 16 caracteres: letras, números o _.');
    const u = { ...me, name, photo, ...(loc || {}) };
    try {
      if (Store.key(name) === Store.key(me.name)) await Store.update(u); else { await Store.claim(u); await Store.remove(me.name); }
      Me.set(u); me = u; msg('Cambios guardados.', true); infographic();
    } catch (x) { msg(x.message === 'taken' ? 'Ese usuario ya existe. Elige otro.' : 'No se pudo guardar. Intenta de nuevo.'); }
  };
  $('del').onclick = async () => {
    if (!confirm('¿Eliminar tu cuenta? Tu usuario quedará libre.')) return;
    try { await Store.remove(me.name); Me.clear(); location.href = '../index.html'; } catch { msg('No se pudo eliminar.'); }
  };

  async function infographic() {
    let users = []; try { users = await Store.all(); } catch {}
    if (!users.some(u => u.name.toLowerCase() === me.name.toLowerCase())) users.push(me);
    users.sort((a, b) => a.joined - b.joined);
    const rank = users.findIndex(u => u.name.toLowerCase() === me.name.toLowerCase()) + 1;
    const mine = users.filter(u => u.cc && u.cc === me.cc).length, pct = Math.round(mine / users.length * 100);
    const done = Math.round(([photo, me.name, me.place].filter(Boolean).length / 3) * 100);
    $('s-rank').textContent = '#' + rank; $('s-total').textContent = users.length;
    $('s-days').textContent = Math.max(1, Math.ceil((Date.now() - me.joined) / 864e5));
    $('s-msgs').textContent = localStorage.getItem('nova-msgs') || 0;
    $('donut').style.setProperty('--p', done); $('donut').firstElementChild.textContent = done + '%';
    $('bar').style.setProperty('--w', pct + '%'); $('bar-t').textContent = `${mine} de ${users.length} usuarios están en ${me.place.split(',').pop().trim()} (${pct}%)`;
  }
  infographic();
})();
