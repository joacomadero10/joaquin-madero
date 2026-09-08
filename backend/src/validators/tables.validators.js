const { z } = require('zod');

const createTableSchema = z.object({
  restaurant_id: z.string().uuid('restaurant_id invalido'),
  name: z.string().min(1, 'El nombre/numero de mesa es requerido').max(50),
});

module.exports = { createTableSchema };
