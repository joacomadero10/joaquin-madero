# Landing page de Comandy

Página institucional de Comandy: `index.html`, un solo archivo autocontenido
(HTML + CSS + un poco de JS inline), sin dependencias externas ni build step.
Se sube tal cual al hosting web de Hostinger.

## Antes de subirla — personalizá estos datos

Abrí `index.html` y buscá (Ctrl+F) los bloques marcados `<!-- EDITAR -->`:

1. **Email y WhatsApp de contacto** (sección `#contacto`): reemplazá
   `contacto@comandy.com.ar` y `+54 9 11 0000-0000` por los reales.
   El email aparece dos veces: en la lista de contacto y en el `action`
   del formulario (`mailto:...`).
2. **Titular del hero**, si querés otro mensaje.
3. **Logo**: hoy es texto ("COMANDY."). Si tenés un logo en imagen, buscá
   `<a href="#top" class="logo-text">` (aparece en el header y el footer)
   y reemplazalo por `<img src="logo.png" alt="Comandy">`.

## Cómo subirla a Hostinger (hosting web, no el VPS)

Esto es para el **plan de hosting web** de Hostinger (donde apunta el
dominio `comandy.com.ar` para la landing pública) — es independiente del
VPS donde corre el backend.

### Opción A — File Manager (más simple)
1. Entrá a **hPanel** → **Sitios web** → tu dominio → **Administrador de archivos**.
2. Andá a la carpeta `public_html`.
3. Si ya hay un `index.html` de ejemplo, borralo (o hacé backup).
4. Subí (**Cargar archivos**) el `index.html` de esta carpeta.
5. Listo — entrando a `https://comandy.com.ar` ya se ve la landing.

### Opción B — FTP
1. En hPanel, andá a **Archivos → Cuentas FTP** y anotá host, usuario y contraseña.
2. Conectate con un cliente FTP (FileZilla, Cyberduck, etc.) a `ftp.comandy.com.ar`.
3. Subí `index.html` a la carpeta `public_html/`.

## Nota sobre el dominio

Si `comandy.com.ar` ya está apuntando al **VPS** (para el backend/app real,
según la guía de configuración que armamos antes), esta landing conviene
publicarla en un **subdominio** (ej: `www.comandy.com.ar` sirviendo la
landing, o `app.comandy.com.ar` apuntando al VPS con el sistema real) para
no pisar la configuración de Nginx del VPS. Avisame si querés que definamos
esa separación de subdominios.
