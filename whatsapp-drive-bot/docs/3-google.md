# Guía 3 · Conectar el bot con tu Google Drive

Tiempo estimado: 20 minutos. Necesitás haber terminado las guías 1 y 2: el bot tiene que
estar online y tenés que conocer su dirección (la **URL del bot**).

Al terminar, el bot va a crear solo esta estructura en tu Drive:
```
BAIRES FLY/
├── LVCCO/  LVCPL/  LVIYQ/  LVFUF/  LVFVZ/  LVKMA/  LVKAX/  LVJQW/
├── PILOTOS/      (adentro, una carpeta por piloto)
└── Históricos/   (versiones anteriores de cada documento)
```

> 💡 Google cambia los nombres de los menús seguido. Si algo no coincide, buscá la opción
> más parecida o mandame una captura.

---

## Paso 1 · Crear un proyecto en Google Cloud (gratis)
1. Entrá a **https://console.cloud.google.com** con tu Gmail. Aceptá las condiciones.
   No hace falta cargar tarjeta.
2. Arriba a la izquierda, al lado del logo, tocá el selector de proyectos → **"Proyecto nuevo"**.
3. Nombre: `Bot BAIRES FLY` → **Crear**. Esperá unos segundos y fijate que quede seleccionado arriba.

## Paso 2 · Habilitar Drive y Sheets
1. En el buscador de arriba escribí **"Google Drive API"** → entrá → **Habilitar**.
2. Volvé al buscador, escribí **"Google Sheets API"** → **Habilitar**.
   La vamos a usar en la etapa 3 para la planilla de vencimientos.

## Paso 3 · Pantalla de permisos (consentimiento OAuth)
1. Buscá **"Google Auth Platform"** (o "Pantalla de consentimiento de OAuth") → **Comenzar**.
2. Completá:
   - Nombre de la app: `Bot BAIRES FLY`
   - Correo de asistencia: tu Gmail
   - Público: **Externo**
   - Información de contacto: tu Gmail
3. Aceptá y tocá **Crear**.
4. Andá a **Público** (Audience) → **"Publicar app"** → Confirmar. Tiene que decir **"En producción"**.

   ⚠️ **Este paso es clave.** Si la app queda "En prueba", Google desconecta el bot cada 7 días.
   No hace falta que Google "verifique" la app: es solo para vos.

## Paso 4 · Crear las credenciales
1. Andá a **Clientes** (Clients) → **"Crear cliente"**.
2. Tipo de aplicación: **Aplicación web**. Nombre: `bot`.
3. En **URIs de redireccionamiento autorizados** → **Agregar URI** y escribí la URL del bot
   seguida de `/google/callback`. Por ejemplo:
   `https://bot-bairesfly.up.railway.app/google/callback`
4. **Crear**. Te muestra dos datos:
   - **ID de cliente** 👉 `GOOGLE_CLIENT_ID`
   - **Secreto del cliente** 👉 `GOOGLE_CLIENT_SECRET`

   Copialos ya: el secreto se muestra una sola vez.

## Paso 5 · Cargar las variables en el hosting
En Railway (**Variables**) o Render (**Environment**), agregá:

| Variable | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | el del paso 4 |
| `GOOGLE_CLIENT_SECRET` | el del paso 4 |
| `URL_PUBLICA` | la URL del bot, sin barra al final (ej. `https://bot-bairesfly.up.railway.app`) |
| `CLAVE_ADMIN` | una contraseña larga que inventes (ej. `Hangar-CCO-2026-q8z`) |

Guardá y esperá a que se vuelva a desplegar (1 o 2 minutos).

## Paso 6 · Darle permiso al bot sobre tu Drive
1. En el navegador, entrá a (con tus datos):
   `https://LA-URL-DEL-BOT/google/conectar?clave=TU_CLAVE_ADMIN`
2. Elegí tu cuenta de Gmail.
3. Va a aparecer **"Google no verificó esta app"**. Es normal: la app es tuya.
   Tocá **Configuración avanzada → Ir a Bot BAIRES FLY (no seguro)**.
4. Tildá todos los permisos → **Continuar**.
5. Vas a ver una página **"✅ Google conectado"** con un código largo. Copialo.

## Paso 7 · Guardar el código
1. En el hosting agregá la variable **`GOOGLE_REFRESH_TOKEN`** con ese código. Guardá.
2. Cuando termine de desplegarse, abrí tu Drive: tiene que aparecer la carpeta
   **BAIRES FLY** con todas las subcarpetas. 🎉

Con la [Guía 4](4-claude.md) (la clave de Claude) ya podés pedir documentos.

---

## Cómo nombrar los archivos
Para que no haga falta abrir un archivo para saber qué es, nombralo así:

```
MATRÍCULA - Documento.pdf        →  LVCCO - Certificado de aeronavegabilidad.pdf
Piloto - Documento.pdf           →  Juan Perez - CMA.pdf
```

Por ahora los archivos los subís vos a la carpeta correcta de Drive. En la etapa 4 se los vas
a poder mandar al bot por WhatsApp y él los va a nombrar y guardar solo.

## Problemas comunes
| Síntoma | Qué hacer |
|---|---|
| Error `redirect_uri_mismatch` | La URI del paso 4.3 tiene que ser exactamente `URL_PUBLICA` + `/google/callback`. Fijate que sea `https` y que no tenga barras de más. |
| "Clave incorrecta" | La `clave=` del link no coincide con `CLAVE_ADMIN`. |
| El bot responde "Todavía no estoy conectado a Google Drive" | Falta `GOOGLE_REFRESH_TOKEN` o no se volvió a desplegar. |
| Funcionaba y a la semana dejó de andar (`invalid_grant` en los logs) | La app quedó "En prueba" (paso 3.4). Publicala y repetí los pasos 6 y 7. |
| No aparecen las carpetas | Mirá los logs del hosting y buscá "No pude crear las carpetas". |
