import apiClient from './client';

export function resolveTableByQrToken(qrToken) {
  return apiClient.get(`/tables/resolve/${qrToken}`).then((res) => res.data);
}

export function listTables(restaurantId) {
  return apiClient.get(`/tables/${restaurantId}`).then((res) => res.data);
}

export function createTable(restaurantId, name) {
  return apiClient.post('/tables', { restaurant_id: restaurantId, name }).then((res) => res.data);
}

export function updateTableStatus(tableId, estado) {
  return apiClient.patch(`/tables/${tableId}/estado`, { estado }).then((res) => res.data);
}

// La ruta de QR requiere Authorization header, y un <img src> comun no puede
// mandar headers custom. Por eso lo pedimos con axios como blob y armamos un
// object URL para usar como src (y como href de descarga).
export function getTableQrBlobUrl(tableId) {
  return apiClient
    .get(`/tables/${tableId}/qr`, { responseType: 'blob' })
    .then((res) => URL.createObjectURL(res.data));
}
