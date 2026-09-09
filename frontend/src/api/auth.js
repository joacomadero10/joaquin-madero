import apiClient from './client';

export function login(email, password) {
  return apiClient.post('/auth/login', { email, password }).then((res) => res.data);
}

export function logout() {
  return apiClient.post('/auth/logout').then((res) => res.data);
}
