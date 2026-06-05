<template>
  <div class="dashboard-container">
    <h1>Dashboard Mahasiswa</h1>
    
    <div class="welcome-section">
      <h2>Selamat datang, {{ store.user?.full_name }}!</h2>
      <p>Kelola pemesanan bahan ajar Anda di sini.</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ cartCount }}</div>
        <div class="stat-label">Items in Cart</div>
        <router-link to="/cart" class="stat-link">Go to Cart →</router-link>
      </div>

      <div class="stat-card">
        <div class="stat-value">{{ orderCount }}</div>
        <div class="stat-label">Total Orders</div>
        <router-link to="/orders" class="stat-link">View Orders →</router-link>
      </div>

      <div class="stat-card">
        <div class="stat-value">{{ approvedCount }}</div>
        <div class="stat-label">Approved Orders</div>
        <router-link to="/orders" class="stat-link">View Details →</router-link>
      </div>
    </div>

    <div class="action-section">
      <h3>Quick Actions</h3>
      <div class="button-group">
        <router-link to="/catalog" class="btn btn-primary">
          Browse Products
        </router-link>
        <router-link to="/orders" class="btn btn-secondary">
          My Orders
        </router-link>
        <router-link to="/cart" class="btn btn-outline">
          Shopping Cart
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ordersAPI from '../../api/orders'
import { store } from '../../store'

const cartCount = ref(0)
const orderCount = ref(0)
const approvedCount = ref(0)

const loadStats = async () => {
  try {
    cartCount.value = store.cart.length
    
    const response = await ordersAPI.getMyOrders()
    const orders = response.data.data || []
    orderCount.value = orders.length
    approvedCount.value = orders.filter(o => o.status === 'payment_approved').length
  } catch (err) {
    console.error('Failed to load stats:', err)
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

.dashboard-container h1 {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
  color: var(--primary);
}

.welcome-section {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
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
  color: var(--primary);
  margin-bottom: var(--spacing-sm);
}

.stat-label {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
}

.stat-link {
  display: inline-block;
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.stat-link:hover {
  color: var(--primary-dark);
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
    min-width: unset;
  }
}
</style>
