<template>
  <div class="register-container">
    <div class="register-card">
      <h1>Daftar Akun</h1>
      
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="full_name">Nama Lengkap</label>
          <input 
            v-model="form.full_name"
            type="text" 
            id="full_name"
            placeholder="Nama Anda"
            required
          />
        </div>

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

        <div class="form-group">
          <label for="phone_number">Nomor Telepon</label>
          <input 
            v-model="form.phone_number"
            type="tel" 
            id="phone_number"
            placeholder="08xx xxxx xxxx"
          />
        </div>

        <div class="form-group">
          <label for="role">Tipe Akun</label>
          <select v-model="form.role" id="role" required>
            <option value="">Pilih Tipe Akun</option>
            <option value="mahasiswa">Mahasiswa</option>
            <!-- <option value="gudang">Gudang</option>
            <option value="admin">Admin</option> -->
          </select>
        </div>

        <button type="submit" class="btn btn-primary" :disabled="loading">
          <span v-if="!loading">Daftar</span>
          <span v-else>Loading...</span>
        </button>
      </form>

      <p class="login-link">
        Sudah punya akun? 
        <router-link to="/login">Login disini</router-link>
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
  full_name: '',
  email: '',
  password: '',
  phone_number: '',
  role: ''
})
const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await authAPI.register(form.value)
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
    error.value = err.response?.data?.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: var(--spacing-lg);
}

.register-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 400px;
}

.register-card h1 {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  color: var(--primary);
}

.login-link {
  text-align: center;
  margin-top: var(--spacing-lg);
  margin-bottom: 0;
}

.login-link a {
  font-weight: 600;
}

@media (max-width: 480px) {
  .register-container {
    padding: var(--spacing-md);
  }

  .register-card {
    padding: var(--spacing-lg);
  }
}
</style>
