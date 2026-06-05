<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1>User Profile</h1>
      
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div v-if="success" class="alert alert-success">
        {{ success }}
      </div>

      <form @submit.prevent="handleUpdate">
        <div class="form-group">
          <label for="full_name">Full Name</label>
          <input 
            v-model="form.full_name"
            type="text" 
            id="full_name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input 
            v-model="form.email"
            type="email" 
            id="email"
            disabled
          />
        </div>

        <div class="form-group">
          <label for="phone_number">Phone Number</label>
          <input 
            v-model="form.phone_number"
            type="tel" 
            id="phone_number"
          />
        </div>

        <div class="form-group">
          <label for="address">Address</label>
          <textarea 
            v-model="form.address"
            id="address"
            rows="4"
          ></textarea>
        </div>

        <div class="button-group">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="!loading">Update Profile</span>
            <span v-else>Saving...</span>
          </button>
          <router-link to="/" class="btn btn-outline">Back</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import authAPI from '../api/auth'
import { store } from '../store'

const form = ref({
  full_name: '',
  email: '',
  phone_number: '',
  address: ''
})
const loading = ref(false)
const error = ref('')
const success = ref('')

const loadProfile = async () => {
  try {
    const response = await authAPI.getCurrentUser()
    form.value = response.data.data
  } catch (err) {
    error.value = 'Failed to load profile'
    console.error(err)
  }
}

const handleUpdate = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    // In a real app, you'd have an update profile API endpoint
    success.value = 'Profile updated successfully'
    console.log('Form data:', form.value)
  } catch (err) {
    error.value = 'Failed to update profile'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 60vh;
  padding: var(--spacing-lg);
}

.profile-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 600px;
}

.profile-card h1 {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  color: var(--primary);
}

.button-group {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.button-group .btn {
  flex: 1;
}

@media (max-width: 768px) {
  .profile-container {
    padding: var(--spacing-md);
  }

  .profile-card {
    padding: var(--spacing-lg);
  }
}
</style>
