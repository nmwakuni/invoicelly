import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Better Auth cookies
})

// No need for token interceptor - Better Auth handles this via cookies

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API functions remain the same...
export const invoicesApi = {
  getAll: () => api.get('/api/invoices'),
  getById: (id: string) => api.get(`/api/invoices/${id}`),
  create: (data: any) => api.post('/api/invoices', data),
  update: (id: string, data: any) => api.patch(`/api/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/api/invoices/${id}`),
}

export const clientsApi = {
  getAll: () => api.get('/api/clients'),
  getById: (id: string) => api.get(`/api/clients/${id}`),
  create: (data: any) => api.post('/api/clients', data),
  update: (id: string, data: any) => api.patch(`/api/clients/${id}`, data),
  delete: (id: string) => api.delete(`/api/clients/${id}`),
}

export const paymentsApi = {
  getAll: () => api.get('/api/payments'),
  getByInvoice: (invoiceId: string) => api.get(`/api/payments/invoice/${invoiceId}`),
  create: (data: any) => api.post('/api/payments', data),
  delete: (id: string) => api.delete(`/api/payments/${id}`),
}


export const analyticsApi = {
  getOverview: () => api.get('/api/analytics/dashboard'),
  getRevenue: (params: any) => api.get('/api/analytics/revenue', { params }),
}

export const subscriptionsApi = {
  checkout: (data: { plan: string; provider: string; billingCycle: string }) =>
    api.post('/api/subscriptions/checkout', data),
  getCurrent: () => api.get('/api/subscriptions/current'),
  cancel: () => api.post('/api/subscriptions/cancel'),
  getPortal: () => api.get('/api/subscriptions/portal'),
}
