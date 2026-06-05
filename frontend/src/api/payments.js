import client from './client'

export const paymentsAPI = {
  getPendingPayments: () => client.get('/payments/pending'),
  getByOrderId: (orderId) => client.get(`/payments/order/${orderId}`),
  uploadProof: (orderId, formData) => client.post(`/payments/upload/${orderId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approve: (id) => client.post(`/payments/${id}/approve`),
  reject: (id, data) => client.post(`/payments/${id}/reject`, data),
  download: (id) => client.get(`/payments/download/${id}`, { responseType: 'blob' }),
}

export default paymentsAPI
