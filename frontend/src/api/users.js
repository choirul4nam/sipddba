import client from './client'

export const usersAPI = {  
  getAll: () => client.get('/users'),
  getByRole: (role) => client.get(`/users/role/${role}`),
  getById: (id) => client.get(`/users/${id}`),
  update: (id, data) => client.put(`/users/${id}`, data),
  toggleStatus: (id) => client.put(`/users/${id}/toggle-status`),
  deactivate: (id) => client.put(`/users/${id}/deactivate`),
}

export default usersAPI