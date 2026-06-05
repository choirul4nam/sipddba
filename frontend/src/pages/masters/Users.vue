<template>
  <div class="users-container">
    <div class="page-header">
      <h1>Master Users</h1>

      <button
        class="btn btn-primary"
        @click="openCreateForm"
      >
        + Tambah Master
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone Number</th>
            <th>Address</th>
            <th>Role</th>
            <!-- <th>Status</th>             -->
            <th width="180">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="user in users"
            :key="user.id"
          >
            <td>{{ user.full_name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.phone_number }}</td>
            <td>{{ user.address }}</td>
            <td>{{ user.role }}</td>
            <!-- <td>{{ user.is_active }}</td>             -->

            <td>
              <button
                class="btn btn-sm btn-secondary"
                @click="editProduct(user)"
              >
                Edit
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteProduct(user)"
              >
                Delete
              </button>
            </td>
            
          </tr>

          <tr v-if="users.length === 0">
            <td colspan="4">
              Belum ada data users
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- FORM -->
    <div v-if="showForm" class="card form-card">
      <h3>
        {{ form.id ? 'Edit Produk' : 'Master Users' }}
      </h3>

      <form @submit.prevent="saveProduct">
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
          <label for="phone_number">Address</label>
          <input 
            v-model="form.address"
            type="text" 
            id="address"
            placeholder="Alamat Anda"
          />
        </div>

        <div class="form-group">
          <label for="role">Tipe Akun</label>
          <select v-model="form.role" id="role" required>
            <option value="">Pilih Tipe Akun</option>
            <option value="mahasiswa">Mahasiswa</option>
            <option value="gudang">Gudang</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div class="button-group">
          <button
            type="submit"
            class="btn btn-primary"
          >
            Simpan
          </button>

          <button
            type="button"
            class="btn btn-outline"
            @click="resetForm"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import usersAPI from '../../api/users'
import auth from '../../api/auth'

const users = ref([])
const error = ref('')
const showForm = ref(false)
// KUNCI PERBAIKAN: Definisikan variabel loading di sini
const loading = ref(false) 

const form = ref({
  id: null,
  full_name: '',
  email: '',
  password: '',
  phone_number: '',
  address: '',
  role: ''
})

const loadUsers = async () => {
  try {
    const res = await usersAPI.getAll()    
    users.value = res.data.data || []
  } catch (err) {
    console.error(err)
    error.value = err.response?.data?.message || 'Gagal memuat data produk'
  }
}

const openCreateForm = () => {
  resetForm()
  showForm.value = true
}

const editProduct = (user) => {
  form.value = {
    id: user.id,
    full_name: user.full_name,
    address: user.address,
    email: user.email,
    role: user.role,
    phone_number: user.phone_number,
    password: '' // Kosongkan password saat edit agar tidak memicu bug text field
  }
  showForm.value = true
}

const deleteProduct = async (user) => {
  if (!confirm(`Nonaktifkan user "${user.full_name}" ?`)) {
    return
  }
  try {
    await usersAPI.deactivate(user.id)
    await loadUsers()
    alert('User berhasil dinonaktifkan')
  } catch (err) {
    console.error(err)
  }
}

const saveProduct = async () => {
  loading.value = true // Aktifkan loading saat tombol diklik
  try {
    if (form.value.id) {
      await usersAPI.update(
        form.value.id,
        form.value
      )
    } else {
      console.log(form.value)
      const registerRes = await auth.register(form.value)
      const newUserId = registerRes.data?.data?.id || registerRes.data?.user?.id
      if (!newUserId) {
        throw new Error('Gagal mendapatkan ID User baru dari server')
      }        
      await usersAPI.update(newUserId, form.value)
    }

    resetForm()
    await loadUsers()
    alert('Data user berhasil disimpan!')
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || 'Gagal menyimpan user')
  } finally {
    loading.value = false // Matikan loading jika proses selesai/gagal
  }
}

const resetForm = () => {
  form.value = {
    id: null,
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    address: '',
    role: ''
  }
  showForm.value = false
}

onMounted(() => {
  loadUsers()
})
</script>