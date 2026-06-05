import client from './client'

export const ordersAPI = {
  getAllOrders: () => client.get('/orders/admin/all'),
  getByStatus: (status) => client.get(`/orders/by_status/${status}`),
  getMyOrders: () => client.get('/orders/my-orders'),
  getById: (id) => client.get(`/orders/${id}`),
  create: (data) => client.post('/orders', data),
  updateStatus: (id, status) => client.put(`/orders/${id}/status`, { status }),
  markAsReceived: (id) => client.put(`/orders/${id}/received`),
}

export default ordersAPI
