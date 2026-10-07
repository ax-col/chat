// Avisos de mensajes nuevos: tarjeta dentro de la página + aviso del sistema + sonido/vibración + contador en el título.
(() => {
  const me = Me.get(); if (!me) return;
  const isChat = /chat\.html$/.test(location.pathname), KEY = 'nova-notif', chatUrl = new URL('chat.html', location.href).href;
  let reg = null, unread = 0; const baseTitle = document.title;
  const supported = 'Notification' in window;
  const enabled = () => localStorage.getItem(KEY) === 'on' && supported && Notification.permission === 'granted';

  const bell = document.createElement('button'); bell.type = 'button'; bell.className = 'bell';
  bell.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><i class="slash"></i>';
  document.body.append(bell);
  const paint = () => { bell.classList.toggle('on', enabled()); bell.setAttribute('aria-label', enabled() ? 'Avisos activados. Toca para desactivar' : 'Activar avisos de mensajes'); };
  paint();

  async function register() { if ('serviceWorker' in navigator) { try { reg = await navigator.serviceWorker.register('../sw.js'); } catch {} } }
  if (enabled()) register();

  function beep() { try { const a = new (window.AudioContext || window.webkitAudioContext)(), o = a.createOscillator(), g = a.createGain(); o.connect(g); g.connect(a.destination); o.frequency.value = 880; g.gain.setValueAtTime(.12, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .25); o.start(); o.stop(a.currentTime + .26); } catch {} if (navigator.vibrate) navigator.vibrate(120); }

  const box = document.createElement('div'); box.className = 'toasts'; document.body.append(box);
  function toast(n, t) {
    const el = document.createElement('div'); el.className = 'toast rgb';
    const h = document.createElement('strong'); h.className = 'flow'; h.textContent = '@' + n;
    const p = document.createElement('span'); p.textContent = t.length > 120 ? t.slice(0, 117) + '…' : t;
    el.append(h, p); el.onclick = () => { if (isChat) el.remove(); else location.href = chatUrl; };
    box.append(el); setTimeout(() => el.remove(), 5500);
  }

  bell.onclick = async () => {
    if (enabled()) { localStorage.setItem(KEY, 'off'); paint(); return; }
    if (!supported) { toast('Avisos', 'Este navegador no permite notificaciones del sistema. Verás las tarjetas dentro de la página.'); return; }
    const p = await Notification.requestPermission();
    if (p === 'granted') { localStorage.setItem(KEY, 'on'); await register(); beep(); toast('Avisos', 'Activados. Te avisaremos de cada mensaje nuevo.'); }
    else toast('Avisos', 'Permiso denegado. Actívalo en los ajustes del sitio del navegador.');
    paint();
  };

  addEventListener('visibilitychange', () => { if (!document.hidden) { unread = 0; document.title = baseTitle; } });

  window.Notify = {
    message({ n, t }) {
      if (!n || n === me.name || typeof t !== 'string') return;
      if (document.hidden) {
        unread++; document.title = `(${unread}) ${baseTitle}`;
        if (enabled()) {
          const opts = { body: t, tag: 'nova-chat', renotify: true, data: { url: chatUrl } };
          if (reg) reg.showNotification('@' + n, opts); else { try { new Notification('@' + n, opts); } catch {} }
        }
        beep();
      } else if (!isChat) { toast(n, t); beep(); }
    }
  };

  // Fuera del chat: escucha solo el mensaje más reciente para avisar de los nuevos.
  if (!isChat && Store.online) {
    const base = NOVA.db.url.replace(/\/$/, ''), seen = new Set(); let first = true;
    const es = new EventSource(`${base}/messages.json?orderBy=${encodeURIComponent('"$key"')}&limitToLast=1`);
    es.addEventListener('put', e => {
      const { path, data } = JSON.parse(e.data); if (data === null) return;
      if (path === '/') { Object.keys(data).forEach(k => seen.add(k)); first = false; return; }
      const id = path.slice(1); if (first || seen.has(id) || path.split('/').length !== 2) return; seen.add(id); Notify.message(data);
    });
  }
})();
