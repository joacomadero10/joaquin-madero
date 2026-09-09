import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// Vacio en dev (Vite proxea /socket.io) y en produccion (mismo origen via Nginx).
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

/**
 * Se conecta a Socket.io, se une al room del restaurante, y escucha
 * "nuevo_pedido" / "pedido_actualizado". Pensado para las pantallas de
 * Cocina, Mozo y el seguimiento de pedido del Cliente.
 *
 * Los callbacks se guardan en un ref para que un socket.on quede fijo
 * (no se re-suscribe en cada render) pero siempre llame a la version
 * mas reciente de la funcion que le pasa el componente.
 */
export function useOrderEvents(restaurantId, { onNuevoPedido, onPedidoActualizado } = {}) {
  const callbacksRef = useRef({ onNuevoPedido, onPedidoActualizado });
  callbacksRef.current = { onNuevoPedido, onPedidoActualizado };

  useEffect(() => {
    if (!restaurantId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join_restaurant', restaurantId);
    });

    socket.on('nuevo_pedido', (order) => {
      callbacksRef.current.onNuevoPedido?.(order);
    });

    socket.on('pedido_actualizado', (order) => {
      callbacksRef.current.onPedidoActualizado?.(order);
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurantId]);
}
