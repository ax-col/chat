// ===== Configuración global =====
window.NOVA = {
  // Base de datos global (Firebase Realtime Database). Vacío = modo demo local (solo tu dispositivo).
  // Pega aquí la URL de tu Realtime Database. Guía paso a paso: README.md
  db: { url: 'https://chatglobal-51793-default-rtdb.firebaseio.com/' },
  // Identidad y staff (Firebase Authentication). Guía: README.md
  auth: {
    apiKey: 'AIzaSyB15ghoM-diGu86QaxG8V64emBxDf-eZIg',              // "Clave de API web" de Firebase (es pública por diseño, no es un secreto)
    // Correo de Firebase Authentication de cada administrador (usuario en minúsculas → correo).
    emails: { andrex: 'httpstv0.es@gmail.com' },
    owners: ['AX_CO']       // dueño fijo: siempre OWNER. El botón ⚙ lo ven todos los que tengan rol (MOD, ADMIN, OWNER)
  },
  chat: { server: 'https://ntfy.sh', room: 'nova-global-sala-x7k2', history: '12h' },
  about: {
    created: '2026-10-06',   // fecha de creación de la página
    countryCode: 'CO'          // país de origen (ISO de 2 letras: CO, MX, ES, AR...). Vacío = país del visitante
  }
};
