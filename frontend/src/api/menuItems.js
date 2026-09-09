import apiClient from './client';

// CRUD de platos - todo requiere auth de admin (el backend lo valida igual).
export function listMenuItems(restaurantId) {
  return apiClient.get(`/menu-items/${restaurantId}`).then((res) => res.data);
}

export function createMenuItem(payload) {
  return apiClient.post('/menu-items', payload).then((res) => res.data);
}

export function updateMenuItem(id, payload) {
  return apiClient.patch(`/menu-items/${id}`, payload).then((res) => res.data);
}

export function deleteMenuItem(id) {
  return apiClient.delete(`/menu-items/${id}`);
}
