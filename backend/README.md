# Comandy — Backend

API REST + Socket.io para Comandy, sistema de gestion de restaurantes.

## Stack

- Node.js 20 LTS + Express
- PostgreSQL (via `pg`, sin ORM)
- Socket.io (pedidos en tiempo real)
- JWT para auth de staff (admin / mozo / cocina)
- Winston (logs rotados en `/var/log/comandy/`)
- PM2 como process manager

## Setup local / primer deploy en el VPS

```bash
cd /var/www/comandy/backend
npm install

cp .env.example .env
# completar DATABASE_URL, JWT_SECRET, FRONTEND_URL, etc.

# crear la carpeta de logs si no existe (ver seccion Logs)
sudo mkdir -p /var/log/comandy
sudo chown comandy:comandy /var/log/comandy

npm run migrate   # crea las tablas
npm run seed       # carga un restaurante + admin de prueba (opcional)
```

## Correr

```bash
npm run dev              # desarrollo, con nodemon
npm start                # produccion, directo con node

# con PM2 (lo que corre en el VPS de verdad):
npm run pm2:start
npm run pm2:logs
npm run pm2:restart
pm2 save                  # persiste la lista de procesos para el arranque automatico
```

## Variables de entorno (`.env`)

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL |
| `JWT_SECRET` | Secreto para firmar los JWT (generar con `openssl rand -hex 64`) |
| `JWT_EXPIRES_IN` | Duracion del token (default `8h`) |
| `PORT` | Puerto de la API (default `5000`, el que Nginx proxea) |
| `NODE_ENV` | `development` \| `production` |
| `FRONTEND_URL` | Origen permitido por CORS y usado en las URLs de los QR |
| `LOG_DIR` | Carpeta de logs (default `/var/log/comandy`) |

## Logs

Winston escribe dos archivos rotados diariamente (14 dias de retencion) en `LOG_DIR`:
- `combined-YYYY-MM-DD.log` — todo (requests, info, errores)
- `error-YYYY-MM-DD.log` — solo errores

PM2 ademas escribe su propio stdout/stderr crudo en `/var/log/comandy/pm2-*.log`
(util para crashes que ocurren antes de que Winston inicialice).

## Rutas de la API

Ver el codigo en `src/routes/` — un archivo por recurso. Resumen:

```
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/menu/:restaurant_id                 (publico)

POST   /api/orders                              (publico, lo hace el cliente)
GET    /api/orders/:restaurant_id                (auth)
PATCH  /api/orders/:id/estado                    (auth)

GET    /api/tables/:restaurant_id                (auth)
POST   /api/tables                               (auth, solo admin)
GET    /api/tables/:id/qr                        (auth) -> imagen PNG

GET    /api/menu-items/:restaurant_id            (auth, solo admin)
POST   /api/menu-items                           (auth, solo admin)
PATCH  /api/menu-items/:id                       (auth, solo admin)
DELETE /api/menu-items/:id                       (auth, solo admin)

GET    /api/reports/daily/:restaurant_id         (auth, solo admin)

GET    /api/health                               (publico, chequeo de vida)
```

## Socket.io

El frontend se conecta y hace `socket.emit('join_restaurant', restaurantId)`
para unirse al room de su restaurante. Eventos que el backend emite a ese room:

- `nuevo_pedido` — al crear un pedido (`POST /api/orders`)
- `pedido_actualizado` — al cambiar el estado de un pedido (`PATCH /api/orders/:id/estado`)

## Seguridad / multi-tenant

Todas las rutas autenticadas validan que el `restaurant_id` de la URL/body
coincida con el `restaurant_id` del JWT del usuario logueado (ver
`src/middlewares/auth.js` → `requireSameRestaurant`, y los chequeos manuales
en los controllers que reciben `:id` sin `restaurant_id` en la URL). Esto
evita que un admin/mozo de un restaurante toque datos de otro cliente del SaaS.

## Nginx (referencia)

```nginx
location /api/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}

location /socket.io/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```
