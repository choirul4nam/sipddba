<template>
  <div class="dashboard-container">
    <h1>Dashboard Gudang</h1>
    
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div class="welcome-section">
      <h2>Selamat datang, {{ store.user?.full_name }}</h2>
      <p>Kelola stok dan proses pengiriman bahan ajar</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ totalProducts }}</div>
        <div class="stat-label">Total Produk</div>
        <router-link to="/products" class="stat-link">Lihat Produk →</router-link>
      </div>

      <div class="stat-card">
        <div class="stat-value">{{ totalStock }}</div>
        <div class="stat-label">Total Stok Onhand</div>
        <router-link to="/products" class="stat-link">Detail Stok →</router-link>
      </div>

      <div class="stat-card">
        <div class="stat-value">{{ pendingShipments }}</div>
        <div class="stat-label">Pengiriman Tertunda</div>
        <router-link to="/orders?status=payment_approved" class="stat-link">Proses Pengiriman →</router-link>
      </div>
    </div>

    <div class="action-section">
      <h3>Quick Actions</h3>
      <div class="button-group">
        <router-link to="/products" class="btn btn-primary">
          Master Produk
        </router-link>
        <router-link to="/orders?status=payment_approved" class="btn btn-secondary">
          Proses Pengiriman
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import productsAPI from '../../api/products'
import ordersAPI from '../../api/orders'
import { store } from '../../store'

const totalProducts = ref(0)
const totalStock = ref(0)
const pendingShipments = ref(0)
const error = ref('')

const loadStats = async () => {
  try {
    const productsRes = await productsAPI.getWithStock()
    const products = productsRes.data.data || []
    
    totalProducts.value = products.length
    totalStock.value = products.reduce((sum, p) => sum + (p.stock_onhand || 0), 0)

    const ordersRes = await ordersAPI.getAllOrders()
    const orders = ordersRes.data.data || []
    pendingShipments.value = orders.filter(o => o.status === 'payment_approved').length
  } catch (err) {
    error.value = 'Failed to load statistics'
    console.error(err)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: var(--spacing-xl) 0;
}

.welcome-section {
  background: linear-gradient(135deg, var(--secondary) 0%, #0d9488 100%);
  color: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-2xl);
  text-align: center;
}

.welcome-section h2 {
  color: white;
  margin-bottom: var(--spacing-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-2xl);
}

.stat-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--secondary);
  margin-bottom: var(--spacing-sm);
}

.stat-label {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
}

.stat-link {
  display: inline-block;
  color: var(--secondary);
  text-decoration: none;
  font-weight: 600;
}

.action-section {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.action-section h3 {
  margin-bottom: var(--spacing-lg);
}

.button-group {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.button-group .btn {
  flex: 1;
  min-width: 200px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .button-group {
    flex-direction: column;
  }

  .button-group .btn {
    width: 100%;
  }
}
</style>
