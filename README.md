# NOVA — guía de puesta en marcha

## 1. Firebase (gratis, plan Spark)
1. **Realtime Database**: crea la base (modo bloqueado) y copia su URL en `js/config.js` → `db.url`.
2. **Authentication → Método de acceso**: habilita **Correo/contraseña**. Las cuentas nuevas siempre se registran con usuario, contraseña y ubicación. El acceso anónimo ya no se usa para cuentas nuevas.
   NO desactives "Habilitar creación (registro)": hace falta para registrar usuarios y permitirles entrar a Staff con la misma contraseña.
3. **Configuración del proyecto → General → Clave de API web** → `js/config.js` → `auth.apiKey`.
4. **Authentication → Usuarios**: confirma que exista la cuenta del OWNER con el correo configurado en `js/config.js`.
5. **Realtime Database → Reglas**: pega `firebase-rules.json` y pulsa **Publicar**. La regla reconoce al OWNER por el correo `httpstv0.es@gmail.com`; si cambias ese correo, reemplázalo también en `firebase-rules.json`.
6. Los usuarios nuevos entran como invitados con usuario, contraseña y ubicación. Conserva el nodo `users` si contiene perfiles antiguos. Las cuentas nuevas usan esa misma contraseña para Staff cuando tienen un rol.
7. En `js/config.js` → `auth.emails` pon el correo de tu cuenta de dueño, y `auth.owners` tu usuario.

## 2. Publicar
Sube TODO el contenido de esta carpeta (incluida `.github` y `sw.js`) a la raíz del repo. GitHub Pages ya está activo.

## 3. Cómo funcionan los roles
Todo se aplica en las reglas de Firebase, no solo en la pantalla.
- **USER**: entra como invitado con usuario y ubicación. Puede activar “Recordar mi acceso” y cerrar sesión desde el botón Salir; no necesita contraseña.
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

## 5. Funciones de moderación implementadas
- **MOD**: ve reportes, elimina mensajes, silencia usuarios por minutos y bloquea usuarios; no administra roles ni cuentas.
- **ADMIN**: todo lo de MOD, además de usuarios, cambios de número de registro e historial administrativo.
- **OWNER**: todo lo de ADMIN y asignación/revocación de roles.
- Cualquier usuario puede reportar un mensaje con el botón ⚑.
- Las sanciones se guardan en Firebase y las reglas del servidor impiden enviar mensajes durante un bloqueo o silencio activo.
- El historial registra cambios de rol, mensajes eliminados, reportes resueltos, silencios, bloqueos y cuentas eliminadas.

## 6. Acceso Invitado y Staff

- **Invitado**: crea o inicia sesión con usuario, contraseña y ubicación para entrar al chat.
- **MOD/ADMIN/OWNER**: entra a Staff con el mismo usuario y contraseña de su cuenta.
- No se crea ni se guarda una contraseña adicional al asignar un rol.

## 7. Configuración segura de Staff
La contraseña se crea al registrar la cuenta y Firebase la almacena de forma segura; la aplicación nunca la guarda en Realtime Database. Al asignar un rol, el usuario puede entrar a Staff con la misma contraseña.
