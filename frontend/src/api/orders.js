import apiClient from './client';

// Sin auth: lo hace el cliente desde su celular al confirmar el pedido.
export function createOrder(payload) {
  return apiClient.post('/orders', payload).then((res) => res.data);
}

// Requiere auth (mozo/cocina/admin).
export function getActiveOrders(restaurantId) {
  return apiClient.get(`/orders/${restaurantId}`).then((res) => res.data);
}

export function updateOrderStatus(orderId, estado) {
  return apiClient.patch(`/orders/${orderId}/estado`, { estado }).then((res) => res.data);
}
