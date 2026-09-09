import apiClient from './client';

export function listCategories(restaurantId) {
  return apiClient.get(`/categories/${restaurantId}`).then((res) => res.data);
}

export function createCategory(restaurantId, name) {
  return apiClient.post('/categories', { restaurant_id: restaurantId, name }).then((res) => res.data);
}

export function deleteCategory(id) {
  return apiClient.delete(`/categories/${id}`);
}
