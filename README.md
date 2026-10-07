# NOVA — guía de puesta en marcha

## 1. Firebase (gratis, plan Spark)
1. **Realtime Database**: crea la base (modo bloqueado) y copia su URL en `js/config.js` → `db.url`.
2. **Authentication → Método de acceso**: habilita **Correo/contraseña** y **Anónimo**.
   NO desactives "Habilitar creación (registro)": hace falta para las cuentas anónimas y de staff.
3. **Configuración del proyecto → General → Clave de API web** → `js/config.js` → `auth.apiKey`.
4. **Authentication → Usuarios**: tu cuenta de dueño (la que ya creaste). Copia su **UID**.
5. **Realtime Database → Reglas**: pega `firebase-rules.json`. Verifica que el UID de las reglas sea el tuyo
   (aparece varias veces como `auth.uid === '...'`; ya trae el UID que usabas). Pulsa **Publicar**.
6. Esta versión cambia el modelo de usuarios. **Borra los datos de prueba** en la pestaña **Datos**:
   los nodos `users`, `messages` y `roles` (con la X). Luego registra primero a tu dueño (AndreX).
7. En `js/config.js` → `auth.emails` pon el correo de tu cuenta de dueño, y `auth.owners` tu usuario.

## 2. Publicar
Sube TODO el contenido de esta carpeta (incluida `.github` y `sw.js`) a la raíz del repo. GitHub Pages ya está activo.

## 3. Cómo funcionan los roles
Todo se aplica en las reglas de Firebase, no solo en la pantalla.
- **USER**: sin contraseña. Usa chat, mapa y perfil.
- **MOD** (con contraseña): ver los mensajes de un usuario y borrarlos (también con la × del chat).
- **ADMIN** (con contraseña): lo de MOD + ver todas las cuentas, su posición (#) y los roles de todos.
- **OWNER** (con contraseña): todo lo anterior + cambiar roles, crear la contraseña de quien asciende,
  cambiar el número de cuenta (#) y eliminar cuentas. Solo el dueño principal (`owners`) puede nombrar otros OWNER.

Ascender a alguien: Panel ⚙ → Usuarios → elegir rol. Se le crea una cuenta de staff con contraseña
(la escribes o se genera; se muestra una sola vez para que se la des en privado). Entra con ⚙ → su contraseña.
Si alguien baja a USER pierde sus poderes; su cuenta de staff queda inactiva.
Para restablecer una contraseña olvidada: Firebase → Authentication → Usuarios → el usuario → restablecer.

## 4. Avisos de mensajes
Campana arriba a la derecha: pide permiso y avisa de cada mensaje nuevo (quién y qué escribió).
Funciona con la página o la app abierta (también en segundo plano). Con el navegador totalmente cerrado
no llegan avisos: eso requiere un servidor de notificaciones push (Firebase Cloud Messaging con un backend de pago).
