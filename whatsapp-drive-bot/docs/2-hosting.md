# Guía 2 · Subir el bot a internet (hosting)

El bot tiene que estar prendido las 24 horas para recibir tus mensajes y mandarte los avisos de las 10 AM.
Hay dos opciones; elegí **una**.

| | **Opción A: Railway** (paga) | **Opción B: Render + cron-job.org** (gratis) |
|---|---|---|
| Costo | ~USD 5/mes (plan Hobby) | USD 0 |
| Dificultad | Fácil: una sola página | Media: dos servicios distintos |
| Velocidad de respuesta | Siempre inmediata | Inmediata mientras el "despertador" funcione. Si falla, la primera respuesta tarda ~1 minuto |
| Confiabilidad de los avisos de las 10 AM | Alta | Buena, pero depende de un servicio externo gratuito |
| Tarjeta de crédito | Sí | No |

**Mi recomendación:** si los USD 5 no son un problema, **Railway**. Te ahorrás un servicio extra y es más confiable para algo de trabajo. Igual podés empezar gratis con Render y pasarte a Railway después: el código es el mismo.

> ⚠️ **Rama de GitHub:** por ahora el código está en la rama
> `claude/vps-ubuntu-nodejs-postgres-smul91` del repo `joaquin-madero`, dentro de la
> carpeta `whatsapp-drive-bot`. En el hosting elegí esa rama. Más adelante lo podemos pasar a `main`.

Antes de empezar, tené a mano los 4 datos de la [Guía 1](1-whatsapp-meta.md).
Las variables de Google y de Claude se agregan después, en las guías 3 y 4.
La lista completa de variables está en el archivo `.env.example`.

---

## Opción A · Railway (~USD 5/mes)

1. Entrá a **https://railway.com** → **Login** → **"Login with GitHub"**. Aceptá los permisos.
2. Contratá el plan **Hobby**: tu perfil (arriba a la derecha) → **Plans** → Hobby.
3. Tocá **"New Project" → "Deploy from GitHub repo"** → elegí `joaquin-madero`.
   Si no aparece, tocá **"Configure GitHub App"** y dale acceso a ese repo.
4. Se crea un "servicio" (un cuadradito). Hacé clic en él → pestaña **Settings**:
   - **Source → Root Directory**: escribí `/whatsapp-drive-bot`.
   - **Source → Branch**: `claude/vps-ubuntu-nodejs-postgres-smul91`.
   - **Networking → "Generate Domain"**. Te da una dirección tipo `https://algo.up.railway.app`.
     👉 Esa es la **URL del bot**.
5. Pestaña **Variables → "Raw Editor"** → pegá esto, reemplazando con tus datos:
   ```
   WHATSAPP_TOKEN=...
   WHATSAPP_PHONE_NUMBER_ID=...
   WHATSAPP_APP_SECRET=...
   WHATSAPP_VERIFY_TOKEN=...
   NUMEROS_AUTORIZADOS=5491144367063
   TZ=America/Argentina/Buenos_Aires
   ```
   Tocá **"Update Variables"** y después **"Deploy"**.
6. Esperá 1 o 2 minutos. Abrí la URL del bot en el navegador: tiene que decir `{"estado":"ok"}` ✅
7. Volvé a la [Guía 1, paso 8](1-whatsapp-meta.md#paso-8--conectar-el-webhook-después-de-subir-el-bot-al-hosting).

**Ver los registros (logs):** clic en el servicio → **Deployments** → **View Logs**.

---

## Opción B · Render + cron-job.org (gratis)

En el plan gratuito, Render "duerme" el bot después de 15 minutos sin uso. Para que no se duerma,
usamos **cron-job.org** (también gratis), que lo "toca" cada 10 minutos.

### B1 · Render
1. Entrá a **https://render.com** → **"Get Started"** → registrate con **GitHub**.
2. **"New +" → "Web Service"** → conectá GitHub y elegí `joaquin-madero`.
3. Completá:
   - **Name**: `bot-bairesfly`
   - **Branch**: `claude/vps-ubuntu-nodejs-postgres-smul91`
   - **Root Directory**: `whatsapp-drive-bot`
   - **Runtime / Language**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn bot.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
4. En **Environment Variables** agregá una por una (botón "Add Environment Variable"):
   `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`,
   `NUMEROS_AUTORIZADOS` = `5491144367063`, `TZ` = `America/Argentina/Buenos_Aires`.
5. **"Create Web Service"**. Esperá unos minutos.
   Arriba aparece la URL, tipo `https://bot-bairesfly.onrender.com`. 👉 Esa es la **URL del bot**.
   Si la abrís, tiene que decir `{"estado":"ok"}` ✅

### B2 · El "despertador" (cron-job.org)
1. Entrá a **https://cron-job.org** → **Sign up** (gratis) → confirmá tu mail.
2. **"Create cronjob"**:
   - **Title**: `Despertar bot`
   - **URL**: la URL del bot (sin `/webhook`)
   - **Execution schedule**: **Every 10 minutes**
3. **Create**.

> En la [Guía 5](5-avisos.md) se agrega un segundo cronjob para los avisos de las 10 AM.

Después seguí con la [Guía 1, paso 8](1-whatsapp-meta.md#paso-8--conectar-el-webhook-después-de-subir-el-bot-al-hosting).

**Ver los registros (logs):** en Render, entrá al servicio → **Logs**.
