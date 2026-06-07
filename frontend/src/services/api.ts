import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const { user } = useAuthStore.getState();
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

export const productAPI = {
  getProducts: (params?: any) => api.get('/products', { params }),
  getProduct: (id: string) => api.get(`/products/${id}`),
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  getRecommendations: (params?: any) => api.get('/products/recommendations', { params }),
  createPurchaseRequest: (data: any) => api.post('/products/purchase-requests', data),
  getPurchaseRequests: () => api.get('/products/purchase-requests'),
};

export const orderAPI = {
  getOrders: (params?: any) => api.get('/orders', { params }),
  getOrder: (id: string) => api.get(`/orders/${id}`),
  createOrder: (data: any) => api.post('/orders', data),
  updateOrderStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
  getLogisticsRecommendations: (data: any) => api.post('/orders/logistics-recommendations', data),
};

export const inventoryAPI = {
  getInventory: (params?: any) => api.get('/inventory', { params }),
  getAlerts: () => api.get('/inventory/alerts'),
  createInventory: (data: any) => api.post('/inventory', data),
  updateInventory: (id: string, data: any) => api.put(`/inventory/${id}`, data),
};

export const inspectionAPI = {
  getReports: () => api.get('/inspection'),
  createReport: (data: any) => api.post('/inspection', data),
  getByTraceCode: (traceCode: string) => api.get(`/inspection/trace/${traceCode}`),
  verifyReport: (data: any) => api.post('/inspection/verify', data),
};

export const memberAPI = {
  getMemberInfo: () => api.get('/member'),
  checkUpgrade: () => api.post('/member/check-upgrade'),
  getLevels: () => api.get('/member/levels'),
};

export const userAPI = {
  getCreditInfo: () => api.get('/users/credit'),
  getPaymentReminders: () => api.get('/users/payment-reminders'),
  makePayment: (data: any) => api.post('/users/payment', data),
};

export const adminAPI = {
  getDashboard: (params?: any) => api.get('/admin/dashboard', { params }),
  getPriceForecast: (params?: any) => api.get('/admin/price-forecast', { params }),
  getInventoryWarnings: () => api.get('/admin/inventory-warnings'),
  getMemberActivity: () => api.get('/admin/member-activity'),
};

export const reportAPI = {
  getMonthlyReport: (params?: any) => api.get('/reports/monthly', { params }),
  exportMonthlyReport: (params?: any, config?: any) => 
    api.get('/reports/monthly/export', { params, ...config }),
};

export default api;
