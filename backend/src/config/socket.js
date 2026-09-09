const { Server } = require('socket.io');
const logger = require('./logger');

let io = null;

/**
 * Inicializa Socket.io sobre el server HTTP existente.
 * Se llama una sola vez desde server.js.
 */
function initSocket(httpServer) {
  const allowedOrigin = process.env.FRONTEND_URL || 'https://comandy.com.ar';

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.debug('Socket conectado', { socketId: socket.id });

    // Cada cliente (pantalla de cocina, mozo, admin, o el cliente final)
    // se une al "room" de su restaurante para recibir solo sus eventos.
    socket.on('join_restaurant', (restaurantId) => {
      if (!restaurantId) return;
      socket.join(restaurantRoom(restaurantId));
      logger.debug('Socket unido a room', { socketId: socket.id, restaurantId });
    });

    socket.on('disconnect', () => {
      logger.debug('Socket desconectado', { socketId: socket.id });
    });
  });

  return io;
}

function restaurantRoom(restaurantId) {
  return `restaurant_${restaurantId}`;
}

/**
 * Devuelve la instancia de io ya inicializada, para usar desde controllers.
 * Lanza si se llama antes de initSocket (error de programacion, no de runtime).
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io no fue inicializado todavia. Llama a initSocket primero.');
  }
  return io;
}

/**
 * Emite "nuevo_pedido" al room del restaurante correspondiente.
 */
function emitNuevoPedido(restaurantId, order) {
  getIO().to(restaurantRoom(restaurantId)).emit('nuevo_pedido', order);
}

/**
 * Emite "pedido_actualizado" al room del restaurante correspondiente.
 */
function emitPedidoActualizado(restaurantId, order) {
  getIO().to(restaurantRoom(restaurantId)).emit('pedido_actualizado', order);
}

/**
 * Emite "mesa_actualizada" al room del restaurante correspondiente.
 * Se usa para cambios de estado de UNA mesa (ej: pidio la cuenta) que no
 * vienen acompañados de un pedido nuevo, para que la grilla del mozo
 * reaccione en vivo sin tener que recargar.
 */
function emitMesaActualizada(restaurantId, table) {
  getIO().to(restaurantRoom(restaurantId)).emit('mesa_actualizada', table);
}

module.exports = {
  initSocket,
  getIO,
  emitNuevoPedido,
  emitPedidoActualizado,
  emitMesaActualizada,
};
