import client from './client'

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  getCurrentUser: () => client.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

export default authAPI
