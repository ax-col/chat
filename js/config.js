// ===== Configuración global =====
window.NOVA = {
  // Base de datos global (Firebase Realtime Database). Vacío = modo demo local (solo tu dispositivo).
  // Pega aquí la URL de tu Realtime Database. Guía paso a paso: README.md
  db: { url: 'https://chatglobal-51793-default-rtdb.firebaseio.com/' },
  chat: { server: 'https://ntfy.sh', room: 'nova-global-sala-x7k2', history: '12h' },
  about: {
    created: '2026-10-06',   // fecha de creación de la página
    countryCode: ''          // país de origen (ISO de 2 letras: CO, MX, ES, AR...). Vacío = país del visitante
  }
};
