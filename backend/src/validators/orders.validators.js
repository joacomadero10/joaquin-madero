const { z } = require('zod');

const orderItemSchema = z.object({
  menu_item_id: z.string().uuid('menu_item_id invalido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  notes: z.string().max(300).optional(),
});

const createOrderSchema = z.object({
  restaurant_id: z.string().uuid('restaurant_id invalido'),
  table_id: z.string().uuid('table_id invalido').optional(),
  items: z.array(orderItemSchema).min(1, 'El pedido necesita al menos un item'),
});

const updateOrderStatusSchema = z.object({
  estado: z.enum(['pendiente', 'en_preparacion', 'listo', 'entregado', 'cancelado']),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };
