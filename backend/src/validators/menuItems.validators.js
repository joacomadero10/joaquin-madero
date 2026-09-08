const { z } = require('zod');

const createMenuItemSchema = z.object({
  restaurant_id: z.string().uuid('restaurant_id invalido'),
  category_id: z.string().uuid('category_id invalido').optional(),
  name: z.string().min(1, 'El nombre es requerido').max(150),
  description: z.string().max(1000).optional(),
  price: z.number().nonnegative('El precio no puede ser negativo'),
  image_url: z.string().url().optional(),
  available: z.boolean().optional(),
});

const updateMenuItemSchema = createMenuItemSchema.partial().omit({ restaurant_id: true });

module.exports = { createMenuItemSchema, updateMenuItemSchema };
