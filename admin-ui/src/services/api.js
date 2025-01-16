import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour les réponses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Configuration du token d'authentification
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export const adminApi = {
  // Statistiques
  getStats: () => api.get('/admin/stats'),

  // Utilisateurs
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserAdmin: (userId) => api.post(`/admin/users/${userId}/toggle-admin`),

  // Transactions
  getTransactions: (params) => api.get('/admin/transactions', { params }),

  // Œuvres
  getWorks: (params) => api.get('/admin/works', { params }),

  // Notifications
  getNotifications: () => api.get('/notifications/unread'),
  markNotificationAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.post('/notifications/read-all')
};
