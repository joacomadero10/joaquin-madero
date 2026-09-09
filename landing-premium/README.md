# Comandy — landing premium

Sitio de marketing de Comandy, en HTML + CSS + JS puro (sin build, sin npm).
Se sube tal cual, arrastrando la carpeta entera, al hosting web de Hostinger.

## Ver antes de subir

```bash
cd landing-premium
python3 -m http.server 8765
# abrir http://localhost:8765/
```

(o simplemente doble click en `index.html` — también funciona sin servidor).

## Páginas

- `index.html` — home
- `producto.html` — las 4 pantallas reales de Comandy (cliente/cocina/mozo/admin), con el showcase que se desliza al scrollear
- `precios.html` — planes + preguntas frecuentes
- `contacto.html` — formulario para pedir una demo

## Qué editar y dónde

| Querés cambiar... | Editá... |
|---|---|
| Email, WhatsApp, textos de cada rol, precios, testimonios | `lib/manifest.js` (documenta todo, aunque el HTML de cada página está escrito a mano — ver nota abajo) |
| El texto real que se ve en cada página | El `.html` de esa página directamente |
| Colores, tipografía, espaciados | `styles.css` (sección 1, tokens `:root`) |
| Las capturas de producto | `assets/img/*.webp` (originales en `assets/photos/source/`) |

**Nota importante:** el contenido de cada página está escrito directamente en el
`.html` (no se genera con JavaScript). Esto es a propósito: así el sitio funciona
igual aunque el visitante tenga JavaScript desactivado. `lib/manifest.js` queda
como referencia/documentación de los mismos datos, pero si cambiás un precio o
un testimonio, tenés que cambiarlo en el `.html` de la página correspondiente
(y opcionalmente también en `manifest.js` para que quede documentado).

## Antes de subir a producción

1. Contacto ya actualizado: WhatsApp `011 4436-7063` y mail `joacomadero10@gmail.com`
   en `contacto.html` y `lib/manifest.js`. Si ese número es una línea fija (no
   tiene el prefijo móvil `15`), el link de WhatsApp en `manifest.js` no va a
   conectar — avisá si es el caso para ajustarlo.
2. Los testimonios en `index.html` son **ilustrativos** (pensados a partir de
   conversaciones con dueños de restaurante, no citas textuales de clientes
   reales de Comandy todavía). Reemplazalos por testimonios reales en cuanto
   los tengas.
3. Los precios dicen "Consultar" a propósito — completá los montos reales en
   `precios.html` cuando los definan.
4. Cada vez que cambies `styles.css` o `main.js`, subí el `?v=20260909` de los
   `<link>`/`<script>` en los 4 `.html` a la fecha del día que subís (evita que
   Hostinger sirva la version vieja cacheada — ver `.htaccess`, ya incluido).

## Deploy en Hostinger

1. hPanel → tu dominio → Administrador de archivos → `public_html`.
2. Subí **todo el contenido** de esta carpeta (incluido el `.htaccess`, que
   suele quedar oculto — activá "mostrar archivos ocultos" en el explorador).
3. Listo — `comandy.com.ar` (o el subdominio que uses) ya sirve el sitio.

Si este dominio ya apunta al VPS donde corre la app real, subí esto a un
subdominio distinto (ej. `www.` para esta landing, `app.` para el sistema real).
