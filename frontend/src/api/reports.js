import apiClient from './client';

export function getDailyReport(restaurantId) {
  return apiClient.get(`/reports/daily/${restaurantId}`).then((res) => res.data);
}
