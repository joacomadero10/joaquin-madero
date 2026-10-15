# Guía 1 · Crear la cuenta de WhatsApp Business API (número de prueba de Meta)

Tiempo estimado: 30 minutos. Necesitás una cuenta de Facebook y tu celular a mano.

> 💡 Los nombres de los botones de Meta cambian seguido. Si algo no coincide
> exactamente, buscá la opción más parecida. Si no la encontrás, mandame una
> captura de pantalla.

Al terminar esta guía vas a tener **4 datos** anotados, que después cargamos en el hosting:

| Dato | Nombre de la variable |
|---|---|
| Identificador del número de teléfono | `WHATSAPP_PHONE_NUMBER_ID` |
| Token de acceso permanente | `WHATSAPP_TOKEN` |
| Clave secreta de la app | `WHATSAPP_APP_SECRET` |
| Una frase que inventás vos | `WHATSAPP_VERIFY_TOKEN` |

Guardalos en un lugar seguro, como un gestor de contraseñas o una nota privada.
**No los mandes por WhatsApp ni por mail.**

---

## Paso 1 · Registrarte como desarrollador
1. Entrá a **https://developers.facebook.com** e iniciá sesión con tu Facebook.
2. Arriba a la derecha tocá **"Comenzar"** (o "Get Started") y seguí los pasos.
   Te va a pedir verificar tu celular o tu mail.

## Paso 2 · Crear la app
1. Andá a **"Mis apps" → "Crear app"**.
2. Nombre de la app: `Bot BAIRES FLY`.
3. Caso de uso: elegí **"Conectar con clientes por WhatsApp"** (o el tipo **"Negocios / Business"**).
4. Si te pide un **portfolio comercial** (Business portfolio), creá uno nuevo con el nombre de tu empresa.
5. Tocá **"Crear app"**.

## Paso 3 · Ver el número de prueba
1. Dentro de la app, en el menú de la izquierda: **WhatsApp → Configuración de la API** (o "API Setup").
2. Vas a ver un **número de prueba** que Meta te regala, con su:
   - **Identificador del número de teléfono** (Phone number ID): un número largo.
     👉 Anotalo como `WHATSAPP_PHONE_NUMBER_ID`.
   - Un **token de acceso temporal**: dura 24 horas, sirve solo para probar.
     El permanente lo sacamos en el paso 6.

## Paso 4 · Autorizar tu celular como destinatario
Con el número de prueba, Meta solo deja mandar mensajes a números que vos registres (hasta 5).
1. En la misma pantalla, en **"Para"** (To), tocá **"Administrar lista de números de teléfono"**.
2. Agregá tu número: **+54 9 11 4436-7063**.
3. Te llega un código por WhatsApp. Ingresalo.
4. Tocá **"Enviar mensaje"**. Te tiene que llegar un "Hello World" de prueba. 🎉
5. Agendá en tu celular el número de prueba que te mandó ese mensaje (por ejemplo como "Bot BAIRES FLY").

## Paso 5 · Clave secreta de la app
1. Menú izquierdo: **Configuración de la app → Básica**.
2. En **"Clave secreta de la app"** tocá **"Mostrar"**. Te va a pedir tu contraseña.
3. 👉 Anotala como `WHATSAPP_APP_SECRET`.

Con esta clave el bot comprueba que cada mensaje viene realmente de Meta y no de un impostor.

## Paso 6 · Token permanente
El token temporal vence a las 24 horas. Para que el bot funcione siempre necesitamos uno permanente.
1. Entrá a **https://business.facebook.com/settings** y elegí tu portfolio.
2. **Usuarios → Usuarios del sistema → Agregar**.
   - Nombre: `bot-bairesfly`
   - Rol: **Administrador**
3. Seleccioná el usuario creado y tocá **"Asignar activos"**:
   - **Apps** → `Bot BAIRES FLY` → activá **Control total**.
   - **Cuentas de WhatsApp** → la cuenta de prueba → activá **Control total**.
4. Tocá **"Generar token"**:
   - App: `Bot BAIRES FLY`
   - Caducidad: **Nunca**
   - Permisos: tildá **`whatsapp_business_messaging`** y **`whatsapp_business_management`**
5. Copiá el token. **Se muestra una sola vez.**
   👉 Anotalo como `WHATSAPP_TOKEN`.

## Paso 7 · Inventá tu frase de verificación
Inventá una frase sin espacios, por ejemplo `aviones-baires-2026-xk9`.
👉 Anotala como `WHATSAPP_VERIFY_TOKEN`.

---

## Paso 8 · Conectar el webhook (después de subir el bot al hosting)
⚠️ **Este paso se hace cuando ya terminaste la [Guía 2 · Hosting](2-hosting.md)**, porque necesitás la dirección web del bot.

1. En la app de Meta: **WhatsApp → Configuración** (Configuration).
2. En **Webhook** tocá **"Editar"**:
   - **URL de devolución de llamada**: la dirección del bot + `/webhook`.
     Por ejemplo: `https://bot-bairesfly.up.railway.app/webhook`
   - **Token de verificación**: tu frase del paso 7.
3. Tocá **"Verificar y guardar"**. Si da error, mirá la sección "Problemas" más abajo.
4. Debajo, en **Campos del webhook**, buscá **`messages`** y tocá **"Suscribirse"**.

## Paso 9 · Probar 🎉
Desde tu celular, mandale **"hola"** al número de prueba. El bot te tiene que contestar:
> ¡Hola! ✈️ Soy el bot de documentos de BAIRES FLY…

---

## Problemas comunes
| Síntoma | Qué hacer |
|---|---|
| "Verificar y guardar" falla | Revisá que la URL termine en `/webhook`, que el bot esté funcionando (si abrís la URL sin `/webhook` en el navegador tiene que decir `{"estado":"ok"}`) y que la frase coincida exactamente con `WHATSAPP_VERIFY_TOKEN`. |
| Escribo y el bot no contesta | 1) ¿Te suscribiste a `messages` en el paso 8.4? 2) Mirá los registros (logs) del hosting. 3) ¿El token es el permanente? |
| En los logs: error `131030` | Tu número no está en la lista de destinatarios del paso 4. |
| En los logs: error `190` | El token venció o está mal copiado. Generá uno nuevo (paso 6). |
| En los logs: "firma inválida" | La `WHATSAPP_APP_SECRET` está mal copiada. |
| En los logs: "número no autorizado" | Revisá `NUMEROS_AUTORIZADOS` (`5491144367063`, sin `+` ni espacios). |
