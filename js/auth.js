// Acceso invitado con Firebase Anonymous y conversión de la misma identidad a contraseña para staff.
(() => {
  const K = (NOVA.auth || {}).apiKey, LOCAL = 'nova-auth-local', SESSION = 'nova-auth-session', LEGACY = 'nova-auth';
  const read = key => { try { return JSON.parse((key === LOCAL ? localStorage : sessionStorage).getItem(key)); } catch { return null; } };
  const current = () => read(LOCAL) || read(SESSION) || (() => { try { const old = JSON.parse(localStorage.getItem(LEGACY)); return old ? { ...old, anon: true } : null; } catch { return null; } })();
  const write = (s, remember) => { localStorage.removeItem(LOCAL); sessionStorage.removeItem(SESSION); localStorage.removeItem(LEGACY); (remember ? localStorage : sessionStorage).setItem(remember ? LOCAL : SESSION, JSON.stringify(s)); };
  const remove = () => { localStorage.removeItem(LOCAL); sessionStorage.removeItem(SESSION); localStorage.removeItem(LEGACY); };
  const post = (url, body, form) => fetch(url, { method: 'POST', headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' }, body });
  const emailFor = name => ((NOVA.auth || {}).emails || {})[String(name).toLowerCase()] || `${String(name).toLowerCase()}@nova-users.app`;
  const friendly = code => ({ EMAIL_EXISTS: 'Ese usuario ya tiene una cuenta.', INVALID_PASSWORD: 'Usuario o contraseña incorrectos.', INVALID_LOGIN_CREDENTIALS: 'Usuario o contraseña incorrectos.', USER_NOT_FOUND: 'Usuario o contraseña incorrectos.', WEAK_PASSWORD: 'La contraseña debe tener al menos 6 caracteres.', TOO_MANY_ATTEMPTS_TRY_LATER: 'Demasiados intentos. Espera unos minutos.', OPERATION_NOT_ALLOWED: 'El acceso invitado no está habilitado en Firebase.' }[code] || code);
  const finish = (j, remember, name, anon) => { if (!j.localId || !j.idToken) throw new Error('AUTH_RESPONSE'); write({ uid: j.localId, t: j.idToken, r: j.refreshToken, exp: Date.now() + (+j.expiresIn - 120) * 1000, name: name || '', anon: !!anon }, remember); return j; };
  window.Auth = {
    ready: !!K, uid: () => (current() || {}).uid || null, session: current, isAnonymous: () => !!(current() || {}).anon, emailFor, friendly,
    async guest(remember) {
      if (!K) throw new Error('API_KEY_INVALID'); const s = current(); if (s && s.uid) return s;
      const r = await post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${K}`, JSON.stringify({ returnSecureToken: true }));
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && j.error.message) || 'GUEST_FAILED'); return finish(j, remember, '', true);
    },
    async link(name, password, remember) {
      const s = current(); if (!s || !s.t) throw new Error('AUTH_REQUIRED');
      const r = await post(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${K}`, JSON.stringify({ idToken: s.t, email: emailFor(name), password, returnSecureToken: true }));
      const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && j.error.message) || 'LINK_FAILED'); return finish(j, remember, name, false);
    },
    async register(name, password, remember) { if (!K) throw new Error('API_KEY_INVALID'); const r = await post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${K}`, JSON.stringify({ email: emailFor(name), password, returnSecureToken: true })); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && j.error.message) || 'REGISTER_FAILED'); return finish(j, remember, name, false); },
    async login(name, password, remember) { if (!K) throw new Error('API_KEY_INVALID'); const r = await post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${K}`, JSON.stringify({ email: emailFor(name), password, returnSecureToken: true })); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error((j.error && j.error.message) || 'LOGIN_FAILED'); return finish(j, remember, name, false); },
    async token() { const s = current(); if (!s) return null; if (Date.now() < s.exp) return s.t; if (!s.r) { remove(); return null; } const r = await post(`https://securetoken.googleapis.com/v1/token?key=${K}`, `grant_type=refresh_token&refresh_token=${encodeURIComponent(s.r)}`, true); const j = await r.json().catch(() => ({})); if (!r.ok) { remove(); return null; } finish(j, !!read(LOCAL), s.name, !!s.anon); return j.id_token; },
    clear() { remove(); }
  };
})();
