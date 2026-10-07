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

## 3. Roles y panel de administración (seguro)
Los roles (OWNER, ADMIN, MOD, USER) se guardan en `/roles`. Solo tu cuenta de Firebase Authentication puede cambiarlos; la contraseña NUNCA va en el código ni en GitHub.
1. Firebase → **Authentication → Comenzar → Método de acceso → Correo/contraseña → Habilitar**.
2. **Authentication → Usuarios → Agregar usuario**: correo `tuusuario@nova-admin.app` (tu usuario de la página en minúsculas) y una contraseña NUEVA y larga.
3. Copia el **UID de usuario** de esa fila.
4. **Realtime Database → Reglas**: pega `firebase-rules.json` y cambia `PEGA_AQUI_EL_UID_DEL_OWNER` por ese UID → **Publicar**.
5. **Configuración del proyecto (engranaje) → General → Clave de API web** → pégala en `js/config.js` → `auth.apiKey`.
6. En `js/config.js` → `auth.staff` pon tu usuario en minúsculas (ej. `['andrex']`).
7. (Recomendado) Authentication → Configuración → Acciones del usuario → desactiva "Habilitar creación (registro)".
8. Regístrate en la página con ese usuario → Perfil → botón ⚙ → contraseña → asígnate OWNER.

### Dueño fijo
En `js/config.js` → `auth.owners` están los usuarios que SIEMPRE se muestran como OWNER (por defecto `AndreX`). Cambiar roles de otros sigue exigiendo la contraseña de Firebase Authentication. No borres la cuenta del dueño: otra persona podría registrar ese nombre.

### Correo del administrador
En `js/config.js` → `auth.emails` va el correo con el que creaste al usuario en Firebase Authentication (ej. `andrex: 'ax@auth.com'`). Si no aparece ahí, se usa `usuario@nova-admin.app`.
