import client from './client'

export const productsAPI = {
  getCatalog: () => client.get('/products/catalog'),
  getWithStock: () => client.get('/products/with-stock'),
  getById: (id) => client.get(`/products/${id}`),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  deactivate: (id) => client.put(`/products/${id}/deactivate`),
  topSelling: () => client.get('/products/top-selling'),
}

export default productsAPI
