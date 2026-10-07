# NOVA — guía de puesta en marcha

## 1. Firebase (gratis, plan Spark)
1. **Realtime Database**: crea la base (modo bloqueado) y copia su URL en `js/config.js` → `db.url`.
2. **Authentication → Método de acceso**: habilita **Correo/contraseña**. Ya no se usa el acceso Anónimo.
   NO desactives "Habilitar creación (registro)": hace falta para el registro de usuarios y para crear cuentas de staff.
3. **Configuración del proyecto → General → Clave de API web** → `js/config.js` → `auth.apiKey`.
4. **Authentication → Usuarios**: confirma que exista la cuenta del OWNER con el correo configurado en `js/config.js`.
5. **Realtime Database → Reglas**: pega `firebase-rules.json` y pulsa **Publicar**. La regla reconoce al OWNER por el correo `httpstv0.es@gmail.com`; si cambias ese correo, reemplázalo también en `firebase-rules.json`.
6. Esta versión usa cuentas persistentes con contraseña. Conserva el nodo `users` si contiene tus perfiles. Si vienes de la versión anónima, registra de nuevo las cuentas normales; `AX_CO` se migra al iniciar con el correo configurado.
7. En `js/config.js` → `auth.emails` pon el correo de tu cuenta de dueño, y `auth.owners` tu usuario.

## 2. Publicar
Sube TODO el contenido de esta carpeta (incluida `.github` y `sw.js`) a la raíz del repo. GitHub Pages ya está activo.

## 3. Cómo funcionan los roles
Todo se aplica en las reglas de Firebase, no solo en la pantalla.
- **USER**: cuenta con usuario y contraseña. Usa chat, mapa y perfil. Puede activar “Recordar mi inicio de sesión” y cerrar sesión desde el botón Salir.
- **MOD** (con contraseña): ver los mensajes de un usuario y borrarlos (también con la × del chat).
- **ADMIN** (con contraseña): lo de MOD + ver todas las cuentas, su posición (#) y los roles de todos.
- **OWNER** (con contraseña): todo lo anterior + cambiar roles, cambiar el número de cuenta (#) y eliminar cuentas. Solo el dueño principal (`owners`) puede nombrar otros OWNER.

Ascender a alguien: Panel ⚙ → Usuarios → elegir rol. No se crea otra cuenta: la persona entra con el mismo usuario y la misma contraseña con que se registró.
Si alguien baja a USER pierde sus poderes. Cada usuario staff puede cambiar su propia contraseña desde ⚙ → Cuenta.
Para cambiar la contraseña de otra cuenta desde el OWNER se necesita un backend administrativo de Firebase o hacerlo desde Firebase Console; una página estática no puede cambiar la contraseña de otro usuario de forma segura.

## 4. Avisos de mensajes
Campana arriba a la derecha: pide permiso y avisa de cada mensaje nuevo (quién y qué escribió).
Funciona con la página o la app abierta (también en segundo plano). Con el navegador totalmente cerrado
no llegan avisos: eso requiere un servidor de notificaciones push (Firebase Cloud Messaging con un backend de pago).
