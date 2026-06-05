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

    <section class="dashboard-section">
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
          <div class="stat-value">{{ totalDipesan }}</div>
          <div class="stat-label">Total Stok Dipesan</div>
          <router-link to="/products" class="stat-link">Detail Stok →</router-link>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ totalStokAkhir }}</div>
          <div class="stat-label">Total Akhir</div>
          <router-link to="/products" class="stat-link">Detail Stok →</router-link>
        </div>

        <div class="stat-card">
          <div class="stat-value">{{ pendingShipments }}</div>
          <div class="stat-label">Pengiriman Tertunda</div>
          <router-link to="/orders?status=payment_approved" class="stat-link">Proses Pengiriman →</router-link>
        </div>
      </div>
    </section>

    <section class="dashboard-section">
      <h2 class="section-heading"> 📈 Analytics </h2> 
      <div class="analytics-grid">            
        <div class="chart-card"> 
          <h3>Pergerakan Stok</h3> 
          <div class="chart-container">
            <apexchart type="bar" height="100%" :options="stokChartOptions" :series="stokChartSeries"></apexchart>
          </div> 
        </div> 
        
        <div class="chart-card"> 
          <h3>Fast Moving Product</h3> 
          <div class="chart-container">
            <apexchart type="bar" height="100%" :options="fastMovingOptions" :series="fastMovingSeries"></apexchart>
          </div> 
        </div> 

      </div> 
    </section>
    

    <!-- <div class="action-section">
      <h3>Quick Actions</h3>
      <div class="button-group">
        <router-link to="/products" class="btn btn-primary">
          Master Produk
        </router-link>
        <router-link to="/orders?status=payment_approved" class="btn btn-secondary">
          Proses Pengiriman
        </router-link>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apexchart from 'vue3-apexcharts'
import productsAPI from '../../api/products'
import ordersAPI from '../../api/orders'
import { store } from '../../store'

const totalProducts = ref(0)
const totalStock = ref(0)
const totalDipesan = ref(0)
const totalStokAkhir= ref(0)
const pendingShipments = ref(0)
const error = ref('')

const stokChartSeries = ref([
  { name: 'Stok On Hand', data: [] },
  { name: 'Stok Dipesan', data: [] }
])
const stokChartOptions = ref({
  chart: { id: 'pergerakan-stok', toolbar: { show: false } },
  xaxis: { categories: [] }, 
  colors: ['#10B981', '#F59E0B'], 
  plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 4 } },
  dataLabels: { enabled: false }
})

// 4. Chart Fast Moving Product
const fastMovingSeries = ref([
  { name: 'Sisa Stok Akhir', data: [] }
])
const fastMovingOptions = ref({
  chart: { id: 'fast-moving', toolbar: { show: false } },
  plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } },
  colors: ['#6366F1'],
  xaxis: { categories: [] }, 
  dataLabels: { enabled: true }
})

const loadStats = async () => {
  try {
    const productsRes = await productsAPI.getWithStock()
    const products = productsRes.data.data || []


    // chart pergerakan stok
    const sampleProducts = products.slice(0, 5)
    stokChartOptions.value = {
      ...stokChartOptions.value,
      xaxis: { categories: sampleProducts.map(p => p.name || 'Produk') }
    }
    stokChartSeries.value = [
      { name: 'Stok On Hand', data: sampleProducts.map(p => Number(p.stock_onhand || 0)) },
      { name: 'Stok Dipesan', data: sampleProducts.map(p => Number(p.stock_order || 0)) }
    ]

    // chart fast moving
    const sortedFastMoving = [...products]
      .sort((a, b) => Number(a.stock_akhir || 0) - Number(b.stock_akhir || 0))
      .slice(0, 5)

    fastMovingOptions.value = {
      ...fastMovingOptions.value,
      xaxis: { categories: sortedFastMoving.map(p => p.name || 'Produk') }
    }
    fastMovingSeries.value = [
      { name: 'Sisa Stok Akhir', data: sortedFastMoving.map(p => Number(p.stock_akhir || 0)) }
    ]
    
    totalProducts.value = products.length
    totalStock.value = products.reduce((sum, p) => sum + (p.stock_onhand || 0), 0)
    totalDipesan.value = products.reduce((sum, p) => sum + (p.stock_order || 0), 0)
    totalStokAkhir.value = products.reduce((sum, p) => sum + (p.stock_akhir || 0), 0)

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
.dashboard-section {
  padding: 20px;
  background-color: #ffffff; /* Sesuai background di gambar */
  border-radius: 8px;
}

.section-heading {
  font-size: 1.5rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* KUNCI UTAMA: Membuat Grid 2 Kolom */
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr)); /* Membagi 2 kolom sama besar */
  gap: 24px; /* Jarak antar card chart */
  width: 100%;
}

/* Styling Card Chart agar proporsional */
.chart-card {
  background: #ffffff;
  border: 1px solid #e5e7eb; /* Border halus */
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.chart-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 15px;
}

/* Pembungkus Ikon/Komponen ApexChart */
.chart-container {
  width: 100%;
  height: 350px; /* Menaikkan tinggi chart agar tidak gepeng */
  position: relative;
}

/* Responsive: Jika dibuka di HP / Layar Kecil, otomatis jadi 1 kolom vertical */
@media (max-width: 1024px) {
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  .chart-container {
    height: 300px; /* Sedikit lebih kecil di HP agar pas */
  }
}
</style>
