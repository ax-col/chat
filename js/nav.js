// Protege las páginas internas y dibuja la barra de acción.
(() => {
  const m = Me.get();
  if (!m || (Store.online && !m.uid)) { Me.clear(); location.replace('../index.html'); return; }
  const items = [['Chat', 'chat.html', '#ff1744'], ['Mapa', 'mapa.html', '#00c853'], ['Perfil', 'perfil.html', '#2979ff'], ['Info', 'info.html', '#d500f9']];
  const cur = location.pathname.split('/').pop(), nav = document.createElement('nav');
  nav.className = 'dock'; nav.setAttribute('aria-label', 'Navegación principal');
  nav.innerHTML = items.map(([t, h, c]) => `<a class="dock-btn${h === cur ? ' active' : ''}" style="--c:${c}" href="${h}">${t}</a>`).join('');
  document.body.append(nav);
})();
