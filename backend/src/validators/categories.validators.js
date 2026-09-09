const { z } = require('zod');

const createCategorySchema = z.object({
  restaurant_id: z.string().uuid('restaurant_id invalido'),
  name: z.string().min(1, 'El nombre es requerido').max(100),
  position: z.number().int().optional(),
});

module.exports = { createCategorySchema };
