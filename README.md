# NOVA — puesta en marcha (gratis, sin tarjeta)

## 1. Base de datos global (Firebase Realtime Database, plan Spark)
1. Entra a https://console.firebase.google.com → **Agregar proyecto** (déjalo en el plan Spark).
2. Menú **Compilación → Realtime Database → Crear base de datos** → elige región → modo **bloqueado**.
3. Pestaña **Reglas** → borra todo, pega el contenido de `firebase-rules.json` → **Publicar**.
4. Pestaña **Datos**: copia la URL de arriba (https://TU-PROYECTO-default-rtdb.firebaseio.com).
5. Pégala en `js/config.js` → `db: { url: '...' }`.

Con eso el usuario único, el mapa y el chat quedan globales y con historial.
Límite gratis de Firebase: 100 conexiones simultáneas (cada chat abierto cuenta como una).

## 2. Publicar la página (HTTPS, gratis)
- **Netlify Drop**: arrastra la carpeta `nova2027` → te da un enlace público.
- **GitHub Pages**: sube la carpeta a un repo → Settings → Pages.
- **Cloudflare Pages**: sube la carpeta o conecta el repo.
Debe abrirse por **https** para que el GPS del navegador funcione.
