import apiClient from './client';

// Menu publico (sin auth) - lo usa el cliente al escanear el QR.
export function getPublicMenu(restaurantId) {
  return apiClient.get(`/menu/${restaurantId}`).then((res) => res.data);
}
