// Protege páginas internas, dibuja navegación y permite cerrar sesión.
(() => {
  const m = Me.get();
  if (!m || (Store.online && (!m.uid || !Auth.uid() || m.uid !== Auth.uid()))) { Me.clear(); Auth.clear(); location.replace('../index.html'); return; }
  const items = [['Chat', 'chat.html', '#ff1744'], ['Mapa', 'mapa.html', '#00c853'], ['Perfil', 'perfil.html', '#2979ff'], ['Info', 'info.html', '#d500f9']];
  const cur = location.pathname.split('/').pop(), nav = document.createElement('nav'); nav.className = 'dock'; nav.setAttribute('aria-label', 'Navegación principal');
  nav.innerHTML = items.map(([t, h, c]) => `<a class="dock-btn${h === cur ? ' active' : ''}" style="--c:${c}" href="${h}">${t}</a>`).join('') + '<button class="dock-btn logout" type="button">Salir</button>';
  document.body.append(nav); nav.querySelector('.logout').onclick = () => { Auth.clear(); Me.clear(); sessionStorage.removeItem('nova-staff'); location.replace('../index.html?logout=1'); };
})();
