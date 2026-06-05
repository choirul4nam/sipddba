<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>Dashboard Admin</h1>
      <p>Selamat datang, {{ store.user?.full_name }}</p>
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="icon">📦</div>
        <div class="stat-value">{{ totalProducts }}</div>
        <div class="stat-label">Total Produk</div>
        <router-link to="/products" class="stat-link">Master Produk →</router-link>
      </div>

      <div class="stat-card">
        <div class="icon">🏪</div>
        <div class="stat-value">{{ totalStock }}</div>
        <div class="stat-label">Total Stok Ditangan</div>
        <router-link to="/products" class="stat-link">Master Produk →</router-link>
      </div>

      <div class="stat-card">
        <div class="icon">🏪</div>
        <div class="stat-value">{{ totalStockDipesan }}</div>
        <div class="stat-label">Total Stok Dipesan</div>
        <router-link to="/products" class="stat-link">Master Produk →</router-link>
      </div>

      <div class="stat-card">
        <div class="icon">🏪</div>
        <div class="stat-value">{{ totalStockAkhir }}</div>
        <div class="stat-label">Total Stok Akhir</div>
        <router-link to="/products" class="stat-link">Master Produk →</router-link>
      </div>

      <div class="stat-card">
        <div class="icon">🛒</div>
        <div class="stat-value">{{ allInvoice }}</div>
        <div class="stat-label">Semua Pesanan</div>
        <router-link to="/orders?status=all" class="stat-link">Lihat Pesanan →</router-link>
      </div>

      <div class="stat-card">
        <div class="icon">🛒</div>
        <div class="stat-value">{{ pendingShipments }}</div>
        <div class="stat-label">Proses Payment</div>
        <router-link to="/orders?status=pending" class="stat-link">Proses Payment →</router-link>
      </div>
    </div>

    <!-- <div class="menu-section">
      <h2>Menu Administrasi</h2>

      <div class="menu-grid">
        <router-link
          to="/products"
          class="menu-card"
        >
          <span class="menu-icon">📦</span>
          <h3>Master Produk</h3>
          <p>Kelola data produk dan stok</p>
        </router-link>

        <router-link
          to="/orders?=all"
          class="menu-card"
        >
          <span class="menu-icon">🛒</span>
          <h3>Semua Pesanan</h3>
          <p>Lihat dan proses pesanan</p>
        </router-link>

        <router-link
          to="/shipments"
          class="menu-card"
        >
          <span class="menu-icon">🚚</span>
          <h3>Pengiriman</h3>
          <p>Kelola proses distribusi</p>
        </router-link>

        <router-link
          to="/admin/reports"
          class="menu-card"
        >
          <span class="menu-icon">📊</span>
          <h3>Laporan</h3>
          <p>Laporan stok dan transaksi</p>
        </router-link>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import productsAPI from '../../api/products'
import ordersAPI from '../../api/orders'
import { store } from '../../store'

const totalProducts = ref(0)
const totalStock = ref(0)
const totalStockDipesan = ref(0)
const totalStockAkhir = ref(0)
const pendingShipments = ref(0)
const allInvoice = ref(0)
const error = ref('')

const loadStats = async () => {
  try {
    const productsRes = await productsAPI.getWithStock()

    const products = productsRes.data.data || []

    totalProducts.value = products.length

    totalStock.value = products.reduce(
      (sum, p) => sum + Number(p.stock_onhand || 0),
      0
    )

    totalStockDipesan.value = products.reduce(
      (sum, p) => sum + Number(p.stock_order || 0),
      0
    )

    totalStockAkhir.value = products.reduce(
      (sum, p) => sum + Number(p.stock_akhir || 0),
      0
    )

    const ordersRes = await ordersAPI.getAllOrders()
    const orders = ordersRes.data.data || []
    pendingShipments.value = orders.filter(o => o.status === 'pending').length
    allInvoice.value = orders.length
  } catch (err) {
    console.error(err)
    if (err.response) {
      console.log('STATUS:', err.response.status)
      console.log('DATA:', err.response.data)
    }
    error.value = 'Gagal memuat statistik dashboard'
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin-bottom: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(250px,1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
}

.icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #0f766e;
}

.stat-label {
  color: #666;
  margin-top: 8px;
}

.menu-section {
  margin-top: 20px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(250px,1fr));
  gap: 20px;
}

.menu-card {
  text-decoration: none;
  color: inherit;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,.08);
  transition: .2s;
}

.menu-card:hover {
  transform: translateY(-4px);
}

.menu-icon {
  font-size: 36px;
  display: block;
  margin-bottom: 12px;
}

.menu-card h3 {
  margin-bottom: 8px;
}

.menu-card p {
  color: #666;
}
</style>