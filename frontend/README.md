# Comandy — Frontend

React + Tailwind. Un solo proyecto que sirve las 4 experiencias de Comandy:

- **Cliente** (`/mesa/:qrToken`) — sin login, escanea el QR y pide desde el celular.
- **Cocina** (`/cocina`) — pantalla en tiempo real de pedidos activos.
- **Mozo** (`/mozo`) — gestión de mesas y cierre de cuentas.
- **Admin** (`/admin`, `/admin/menu`, `/admin/mesas`) — reportes, menú y QRs.

## Setup

```bash
cd /var/www/comandy/frontend
npm install
cp .env.example .env   # normalmente se deja vacío, ver el archivo
npm run dev             # desarrollo (http://localhost:5173, proxea /api al backend en :5000)
```

## Build para producción

```bash
npm run build   # genera dist/, que es lo que Nginx sirve como estático
npm run preview # sirve dist/ localmente para verificar el build antes de subirlo
```

`dist/` es el resultado final: se copia a donde Nginx lo sirva (ver
`backend/README.md` para el bloque de Nginx de referencia — el mismo Nginx
que proxea `/api` y `/socket.io` al backend también sirve estos archivos
estáticos con fallback a `index.html` para que el routing de React funcione).

## Cómo se conecta con el backend

- En desarrollo, `vite.config.js` proxea `/api` y `/socket.io` a `http://localhost:5000`.
- En producción, el build estático vive en el mismo dominio que el backend
  (vía Nginx), así que las llamadas a `/api/...` y la conexión de Socket.io
  van al mismo origen sin configurar nada. Si el front y el back llegan a
  vivir en dominios distintos, completar `VITE_API_URL` / `VITE_SOCKET_URL`
  en `.env` antes de `npm run build`.

## Flujo del cliente (QR → pedido → seguimiento)

1. El QR de cada mesa (generado en `/admin/mesas`) apunta a `/mesa/:qrToken`.
2. Esa pantalla resuelve el token contra `GET /api/tables/resolve/:qr_token`
   (público) para obtener `restaurant_id` + `table_id`, y con eso carga el
   menú público (`GET /api/menu/:restaurant_id`).
3. El cliente arma el carrito (estado local, `CartContext`) y confirma —
   `POST /api/orders` — sin necesitar cuenta ni login.
4. Lo mandamos a `/pedido/:orderId`, que se conecta a Socket.io y escucha
   `pedido_actualizado` para mostrar el estado en vivo (pendiente → en
   preparación → listo → entregado), sin recargar la página.

## Autenticación de staff

Login único (`/login`) para admin/mozo/cocina — pega contra
`POST /api/auth/login`, guarda el JWT en `localStorage` y redirige según el
`role` que viene en la respuesta. `ProtectedRoute` corta el acceso a rutas
de otro rol (ej: un mozo no puede entrar a `/admin`).

## Notas sobre el backend

El frontend asume estos endpoints, algunos agregados durante esta etapa
porque el flujo real los necesitaba (documentados en `backend/README.md`):

- `GET /api/tables/resolve/:qr_token` (público) — resuelve el QR a mesa/restaurante.
- `PATCH /api/tables/:id/estado` (auth) — el mozo libera la mesa al cerrar la cuenta.
- `GET/POST/DELETE /api/categories/...` (auth, admin) — categorías del menú.
