(() => {
  const me = Me.get(); if (!me) return;
  const $ = id => document.getElementById(id), A = NOVA.about;
  const d = new Date(A.created + 'T00:00:00'), days = Math.max(0, Math.floor((Date.now() - d) / 864e5));
  $('since').textContent = d.toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  $('days').textContent = days ? `Hace ${days} días` : 'Desde hoy';
  $('db').textContent = Store.online ? 'Base de datos global conectada' : 'Modo demo (conecta la base de datos en js/config.js)';
  const cc = (A.countryCode || me.cc || '').toUpperCase();
  $('cc-note').textContent = A.countryCode ? 'País de origen de la página' : 'Tu país (define el país de origen en js/config.js)';
  if (!cc) return $('country').textContent = 'Sin país detectado.';
  fetch(`https://restcountries.com/v3.1/alpha/${cc}?fields=name,capital,population,region,languages,flags`).then(r => r.json()).then(c => {
    $('flag').src = c.flags.png; $('flag').alt = 'Bandera de ' + c.name.common;
    $('country').innerHTML = '';
    [['País', c.name.common], ['Capital', (c.capital || ['—'])[0]], ['Región', c.region], ['Población', c.population.toLocaleString('es')], ['Idiomas', Object.values(c.languages || {}).join(', ')]]
      .forEach(([k, v]) => { const p = document.createElement('p'); const b = document.createElement('b'); b.textContent = k + ': '; p.append(b, v); $('country').append(p); });
  }).catch(() => $('country').textContent = 'No se pudo cargar la información del país.');
})();
