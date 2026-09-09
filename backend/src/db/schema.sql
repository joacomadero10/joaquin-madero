-- Esquema inicial de Comandy
-- Ejecutar con: psql -U comandy_user -d comandy_db -f src/db/schema.sql
-- (o via: npm run migrate)

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- para gen_random_uuid()

-- =========================
-- RESTAURANTS (tenants)
-- =========================
CREATE TABLE IF NOT EXISTS restaurants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(80) UNIQUE NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- USERS (staff: admin, mozo, cocina)
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           VARCHAR(150) NOT NULL,
  email          VARCHAR(150) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'mozo', 'cocina')),
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_restaurant ON users(restaurant_id);

-- =========================
-- TABLES (mesas)
-- =========================
CREATE TABLE IF NOT EXISTS tables (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           VARCHAR(50) NOT NULL,
  qr_token       VARCHAR(64) UNIQUE NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'libre' CHECK (status IN ('libre', 'ocupada', 'cuenta_pedida')),
  -- Cuando se abrio la mesa (primer pedido de la sesion actual). NULL si esta libre.
  -- El panel del mozo la muestra ("Abierta a las..."); se limpia al cerrar la cuenta.
  opened_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tables ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);

-- =========================
-- CATEGORIES (categorias del menu)
-- =========================
CREATE TABLE IF NOT EXISTS categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  position       INTEGER NOT NULL DEFAULT 0,
  active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_restaurant ON categories(restaurant_id);

-- =========================
-- MENU ITEMS (platos)
-- =========================
CREATE TABLE IF NOT EXISTS menu_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  name           VARCHAR(150) NOT NULL,
  description    TEXT,
  price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url      TEXT,
  available      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

-- =========================
-- ORDERS (pedidos)
-- =========================
CREATE TABLE IF NOT EXISTS orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id       UUID REFERENCES tables(id) ON DELETE SET NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  total          NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Defensivo: si esta migracion ya corrio antes de que "notes" existiera,
-- CREATE TABLE IF NOT EXISTS no la agrega sola. Este ALTER si lo hace,
-- y no rompe nada si la columna ya esta.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(restaurant_id, status);

-- =========================
-- ORDER ITEMS (items de un pedido)
-- =========================
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id   UUID NOT NULL REFERENCES menu_items(id),
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10, 2) NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =========================
-- Semilla minima: NO incluye datos reales, solo estructura.
-- Usar src/db/seed.js para cargar un restaurante + admin de prueba.
-- =========================
