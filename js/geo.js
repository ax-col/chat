// Ubicación: GPS o búsqueda por texto (OpenStreetMap Nominatim, sin API key). Se redondea a ~11 km por privacidad.
(() => {
  const NM = 'https://nominatim.openstreetmap.org';
  const label = a => [a.city || a.town || a.village || a.state, a.country].filter(Boolean).join(', ');
  const fin = (lat, lng, a, fb) => ({ lat: Math.round(lat * 10) / 10, lng: Math.round(lng * 10) / 10, place: label(a || {}) || fb || 'Ubicación', cc: (a?.country_code || '').toUpperCase() });
  const Geo = {
    gps: () => new Promise((ok, no) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => ok(p.coords), () => no(new Error('gps')), { timeout: 10000 }) : no(new Error('gps'))),
    async reverse(c) { const j = await (await fetch(`${NM}/reverse?format=jsonv2&zoom=10&accept-language=es&lat=${c.latitude}&lon=${c.longitude}`)).json(); return fin(c.latitude, c.longitude, j.address); },
    async search(q) { const j = await (await fetch(`${NM}/search?format=jsonv2&limit=1&addressdetails=1&accept-language=es&q=${encodeURIComponent(q)}`)).json(); if (!j[0]) throw new Error('nf'); return fin(+j[0].lat, +j[0].lon, j[0].address, j[0].display_name.split(',')[0]); },
    picker(el, cb, initial) {
      el.innerHTML = `<div class="loc"><input class="in q" placeholder="Ciudad o país" aria-label="Ciudad o país"><button type="button" class="btn s" style="--c:#2979ff">Buscar</button><button type="button" class="btn g" style="--c:#00c853">Usar mi ubicación</button></div><p class="hint"></p>`;
      const q = el.querySelector('.q'), hint = el.querySelector('.hint');
      hint.textContent = initial ? 'Ubicación actual: ' + initial : '';
      const run = async fn => { hint.textContent = 'Buscando…'; try { const p = await fn(); hint.textContent = 'Ubicación: ' + p.place; cb(p); } catch (e) { hint.textContent = e.message === 'gps' ? 'No pudimos usar el GPS. Escribe tu ciudad.' : 'No encontramos ese lugar. Prueba con otra ciudad.'; } };
      const search = () => q.value.trim() && run(() => Geo.search(q.value.trim()));
      el.querySelector('.s').onclick = search;
      el.querySelector('.g').onclick = () => run(async () => Geo.reverse(await Geo.gps()));
      q.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); search(); } });
    }
  };
  window.Geo = Geo;
})();
