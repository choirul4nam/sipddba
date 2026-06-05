<template>
  <div class="login-container">
    <div class="login-card">
      <h1>Login</h1>
      
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            v-model="form.email"
            type="email" 
            id="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input 
            v-model="form.password"
            type="password" 
            id="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="!loading">Login</span>
          <span v-else>Loading...</span>
        </button>
      </form>

      <p class="register-link">
        Belum punya akun? 
        <router-link to="/register">Daftar disini</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import authAPI from '../api/auth'
import { store } from '../store'

const router = useRouter()
const form = ref({
  email: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await authAPI.login(form.value)
    const { data, token } = response.data

    store.setUser(data, token)
    
    // Redirect based on role
    const roleRoutes = {
      mahasiswa: '/dashboard',
      gudang: '/gudang/dashboard',
      admin: '/admin/dashboard'
    }
    
    const redirectUrl = roleRoutes[data.role] || '/'
    router.push(redirectUrl)
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed'
    console.log(err.response?.data?.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--spacing-lg);
}

.login-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
}

.login-card h1 {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  color: var(--primary);
}

.register-link {
  text-align: center;
  margin-top: var(--spacing-lg);
  margin-bottom: 0;
}

.register-link a {
  font-weight: 600;
}

@media (max-width: 480px) {
  .login-container {
    padding: var(--spacing-md);
  }

  .login-card {
    padding: var(--spacing-lg);
  }
}
</style>
