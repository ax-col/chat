// Onda de color al tocar: usa el color del elemento (--c) o cicla rojo, verde, azul.
(() => {
  const rgb = ['#ff1744', '#00e676', '#2979ff']; let i = 0;
  document.addEventListener('pointerdown', e => {
    const host = e.target.closest('a,button,.card,.stat'); if (!host) return;
    const r = host.getBoundingClientRect(), s = document.createElement('span');
    s.className = 'ripple'; s.style.left = e.clientX - r.left + 'px'; s.style.top = e.clientY - r.top + 'px';
    s.style.setProperty('--rc', getComputedStyle(host).getPropertyValue('--c').trim() || rgb[i++ % 3]);
    host.append(s); setTimeout(() => s.remove(), 700);
  });
})();
