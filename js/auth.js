// Identidad de cada usuario: sesión anónima de Firebase Authentication (uid propio, sin contraseña).
(() => {
  const K = (NOVA.auth || {}).apiKey, SK = 'nova-auth';
  const load = () => { try { return JSON.parse(localStorage.getItem(SK)); } catch { return null; } };
  const save = s => localStorage.setItem(SK, JSON.stringify(s));
  const post = (url, body, form) => fetch(url, { method: 'POST', headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' }, body });
  window.Auth = {
    ready: !!K,
    uid: () => (load() || {}).uid || null,
    async anon() {
      if (load()) return;
      const r = await post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${K}`, JSON.stringify({ returnSecureToken: true }));
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(String(j.error && j.error.message).includes('OPERATION_NOT_ALLOWED') ? 'anon-off' : 'net');
      save({ uid: j.localId, t: j.idToken, r: j.refreshToken, exp: Date.now() + (+j.expiresIn - 120) * 1000 });
    },
    async token() {                       // idToken vigente (se renueva solo)
      const s = load(); if (!s) return null;
      if (Date.now() < s.exp) return s.t;
      const r = await post(`https://securetoken.googleapis.com/v1/token?key=${K}`, `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.r)}`, true);
      const j = await r.json().catch(() => ({})); if (!r.ok) return null;
      save({ uid: j.user_id, t: j.id_token, r: j.refresh_token, exp: Date.now() + (+j.expires_in - 120) * 1000 });
      return j.id_token;
    },
    clear() { localStorage.removeItem(SK); }
  };
})();
