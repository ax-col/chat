(() => {
  const me = Me.get(); if (!me) return;
  const map = L.map('map', { worldCopyJump: true, minZoom: 2 }).setView([me.lat, me.lng], 3);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(map);
  const layer = L.layerGroup().addTo(map), colors = ['#ff1744', '#00e676', '#2979ff', '#d500f9', '#00e5ff', '#ff6d00'];
  const hash = s => [...s].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7);
  async function draw() {
    let users = []; try { users = await Store.all(); } catch {}
    if (!users.some(u => u.name.toLowerCase() === me.name.toLowerCase())) users.push(me);
    document.getElementById('count').textContent = users.length + (users.length === 1 ? ' persona registrada' : ' personas registradas');
    layer.clearLayers();
    users.forEach(u => {
      const h = hash(u.name), mine = u.name.toLowerCase() === me.name.toLowerCase();
      const jit = n => ((h >> n) % 100 - 50) / 1000;                // separa pines que comparten ciudad
      const icon = L.divIcon({ className: '', iconSize: [24, 24], iconAnchor: [12, 12], html: `<span class="pin${mine ? ' me' : ''}" style="--c:${mine ? '#fff' : colors[h % 6]}"></span>` });
      const box = document.createElement('div'); box.className = 'pop';
      if (u.photo && u.photo.startsWith('data:image/')) { const im = document.createElement('img'); im.src = u.photo; im.alt = ''; box.append(im); }
      const n = document.createElement('b'); n.textContent = '@' + u.name + (mine ? ' (tú)' : '');
      const p = document.createElement('small'); p.textContent = u.place || '';
      box.append(n, p);
      L.marker([u.lat + jit(3), u.lng + jit(9)], { icon }).bindPopup(box).addTo(layer);
    });
  }
  draw(); setInterval(draw, 20000);
})();
