<template>
  <div class="products-container">
    <div class="page-header">
      <h1>Master Produk</h1>

      <button
        class="btn btn-primary"
        @click="openCreateForm"
      >
        + Tambah Produk
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Nama Produk</th>
            <th>Description</th>
            <th>Category</th>
            <th>Unit Type</th>
            <th>Unit Price</th>
            <th>Stok Ditangan</th>
            <th>Stok Dipesan</th>
            <th>Stok Akhir</th>
            <th width="180">Aksi</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="product in products"
            :key="product.id"
          >
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.description }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.unit_type }}</td>
            <td>{{ product.unit_price }}</td>
            <td>{{ product.stock_onhand }}</td>
            <td>{{ product.stock_order }}</td>
            <td>{{ product.stock_akhir }}</td>

            <td>
              <button
                class="btn btn-sm btn-secondary"
                @click="editProduct(product)"
              >
                Edit
              </button>
              <button
                class="btn btn-sm btn-danger"
                @click="deleteProduct(product)"
              >
                Delete
              </button>
            </td>
            
          </tr>

          <tr v-if="products.length === 0">
            <td colspan="4">
              Belum ada data produk
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- FORM -->
    <div v-if="showForm" class="card form-card">
      <h3>
        {{ form.id ? 'Edit Produk' : 'Tambah Produk' }}
      </h3>

      <form @submit.prevent="saveProduct">
        <div class="form-group">
          <label>Kode Produk</label>
          <input
            v-model="form.code"
            class="form-control"
            required
          >
        </div>

        <div class="form-group">
          <label>Nama Produk</label>
          <input
            v-model="form.name"
            class="form-control"
            required
          >
        </div>

        <div class="form-group">
          <label>Description</label>
          <input
            v-model="form.description"
            class="form-control"
            required
          >
        </div>

        <div class="form-group">
          <label>Category</label>
          <input
            v-model="form.category"
            class="form-control"
            required
          >
        </div>

        <div class="form-group">
          <label>Unit Type</label>
          <input
            v-model="form.unit_type"
            class="form-control"
            required
          >
        </div>

        <div class="form-group">
          <label>Stok Awal</label>
          <input
            v-model.number="form.stock_onhand"
            type="number"
            class="form-control"
          >
        </div>

        <div class="form-group">
          <label>Unit Price</label>
          <input
            v-model.number="form.unit_price"
            type="number"
            class="form-control"
          >
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
import productsAPI from '../../api/products'

const products = ref([])
const error = ref('')
const showForm = ref(false)

const form = ref({
  id: null,
  code: '',
  name: '',
  stock_onhand: 0
})

const loadProducts = async () => {
  try {
    const res = await productsAPI.getWithStock()

    products.value = res.data.data || []
  } catch (err) {
    console.error(err)
    error.value =
      err.response?.data?.message ||
      'Gagal memuat data produk'
  }
}

const openCreateForm = () => {
  resetForm()

  showForm.value = true
}

const editProduct = (product) => {
  form.value = {
    id: product.id,
    code: product.code,
    name: product.name,
    stock_onhand: product.stock_onhand || 0
  }

  showForm.value = true
}

const deleteProduct = async (product) => {
  if (!confirm(`Nonaktifkan produk "${product.name}" ?`)) {
    return
  }

  try {
    await productsAPI.deactivate(product.id)

    await loadProducts()

    alert('Produk berhasil dinonaktifkan')
  } catch (err) {
    console.error(err)
  }
}

const saveProduct = async () => {
  try {
    if (form.value.id) {
      await productsAPI.update(
        form.value.id,
        form.value
      )
    } else {
      console.log(form.value)
      await productsAPI.create(form.value)
    }

    resetForm()
    await loadProducts()
  } catch (err) {
    console.error(err)
    alert(
      err.response?.data?.message ||
      'Gagal menyimpan produk'
    )
  }
}

const resetForm = () => {
  form.value = {
    id: null,
    code: '',
    name: '',
    stock_onhand: 0
  }

  showForm.value = false
}

onMounted(() => {
  loadProducts()
})
</script>