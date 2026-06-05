<template>
  <div class="dashboard-container">
    <div class="welcome-section">
      <h2>Selamat datang, {{ store.user?.full_name }}</h2>
      
    </div>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <!-- MASTER PRODUK --> 
     <section class="dashboard-section"> 
      <h2 class="section-heading"> 📦 Master Produk </h2> 
      <div class="stats-grid"> 
        <div class="stat-card"> 
          <div class="icon">📦</div> 
          <div class="stat-value">{{ totalProducts }}</div> 
        <div class="stat-label">Total Produk</div> 
      </div> 
      <div class="stat-card"> 
        <div class="icon">🏪</div> 
        <div class="stat-value">{{ totalStock }}</div> 
        <div class="stat-label">Stok Ditangan</div> 
      </div> 
      <div class="stat-card"> 
        <div class="icon">📥</div> 
        <div class="stat-value">{{ totalStockDipesan }}</div> 
        <div class="stat-label">Stok Dipesan</div> 
      </div> 
      <div class="stat-card"> 
        <div class="icon">📊</div>
        <div class="stat-value">{{ totalStockAkhir }}</div> 
        <div class="stat-label">Stok Akhir</div> </div> 
      </div> 
    </section>

    <!-- MASTER USER --> 
    <section class="dashboard-section"> 
      <h2 class="section-heading"> 👥 Master User </h2> 
      <div class="stats-grid"> 
        <div class="stat-card"> 
          <div class="icon">👥</div> 
          <div class="stat-value">{{ totalUsers }}</div> 
          <div class="stat-label">Total User</div> 
        </div> 
        <div class="stat-card"> 
          <div class="icon">🧑</div> 
          <div class="stat-value">{{ totalCustomers }}</div> 
          <div class="stat-label">Mahasiswa</div> 
        </div> 
        <div class="stat-card"> 
          <div class="icon">🧑</div> 
          <div class="stat-value">{{ totalCustomers }}</div> 
          <div class="stat-label">Gudang</div> 
        </div> 
        <div class="stat-card"> 
          <div class="icon">🛡️</div> 
          <div class="stat-value">{{ totalAdmins }}</div> 
          <div class="stat-label">Admin</div> 
        </div> <div class="stat-card"> 
          <div class="icon">✅👤</div> 
          <div class="stat-value">{{ activeUsers }}</div> 
          <div class="stat-label">User Aktif</div> 
        </div>
        <div class="stat-card"> 
          <div class="icon">🚫👤</div> 
          <div class="stat-value">{{ inactiveUsers }}</div> 
          <div class="stat-label">User Non Aktif</div> 
        </div> 
      </div> 
    </section>

    <!-- ORDERS --> 
     <section class="dashboard-section"> 
      <h2 class="section-heading"> 🛒 Orders </h2> 
      <div class="stats-grid"> <div class="stat-card"> 
        <div class="icon">🛒</div> 
        <div class="stat-value">{{ allInvoice }}</div> 
        <div class="stat-label">All Orders</div> 
      </div> 
      <div class="stat-card"> 
        <div class="icon">💳</div> 
        <div class="stat-value">{{ pendingToSubmitted }}</div> 
        <div class="stat-label">Payment To Submitted</div> 
      </div>
      <div class="stat-card"> 
        <div class="icon">💳</div> 
        <div class="stat-value">{{ pendingShipments }}</div> 
        <div class="stat-label">Payment To Approval</div> 
      </div> 
      <div class="stat-card"> 
        <div class="icon">💳</div> 
        <div class="stat-value">{{ paymentApproval }}</div> 
        <div class="stat-label">Payment Approval</div> 
      </div>
       
      <div class="stat-card"> 
        <div class="icon">🚚</div> 
        <div class="stat-value">{{ shippedOrders }}</div> 
        <div class="stat-label">Order Shipped</div> 
      </div> 
      <div class="stat-card"> 
        <div class="icon">📦</div> 
        <div class="stat-value">{{ receivedOrders }}</div> 
        <div class="stat-label">Order Received</div> 
      </div>
      <div class="stat-card"> 
        <div class="icon">🚫</div> 
        <div class="stat-value">{{ orderRejected }}</div> 
        <div class="stat-label">Order Rejected Payment</div> 
      </div>
      <div class="stat-card"> 
        <div class="icon">🚫</div> 
        <div class="stat-value">{{ orderCancelled }}</div> 
        <div class="stat-label">Order Cancelled</div> 
      </div>
    </div> 
    </section>

    <!-- Charts -->
    <section class="dashboard-section"> 
      <h2 class="section-heading"> 📈 Analytics </h2> 
      <div class="analytics-grid"> 
        
        <div class="chart-card"> 
          <h3>Order Per Bulan</h3> 
          <div class="chart-container">
            <apexchart type="line" height="100%" :options="orderChartOptions" :series="orderChartSeries"></apexchart>
          </div> 
        </div> 

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

    <!-- TABLES -->
    <section class="dashboard-section">
      <div class="table-grid">

        <!-- ORDER TERBARU -->
        <div class="table-card">
          <h3>🕒 Order Terbaru</h3>

          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Mahasiswa</th>
                <th>Email</th>
                <th>Order Date</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="recentOrders.length === 0">
                <td colspan="3" class="empty">
                  Belum ada data
                </td>
              </tr>

              <tr
                v-for="order in recentOrders"
                :key="order.id"
              >
                <td>{{ order.order_number }}</td>
                <td>{{ order.full_name }}</td>
                <td>{{ order.email }}</td>
                <td>{{ order.order_date }}</td>
                <td>{{ order.total_amount }}</td>
                <td>{{ order.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- STOK MENIPIS -->
        <div class="table-card">
          <h3>⚠️ Stok Menipis (kurang dari 100)</h3>

          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Stok</th>
                <!-- <th>Minimum</th> -->
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in lowStocks"
                :key="item.name"
              >
                <td>{{ item.name }}</td>
                <td>{{ item.stock_akhir }}</td>
                <!-- <td>{{ item.minimum }}</td> -->
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </section>

    <!-- TOP PRODUCT -->
    <section class="dashboard-section">
      <div class="table-card">
        <h3>🏆 10 Produk Terlaris</h3>

        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Produk</th>
              <th>Description</th>
              <th>Qty</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in topProducts"
              :key="item.name"
            >
              <td>{{ item.code }}</td>
              <td>{{ item.name }}</td>
              <td>{{ item.description }}</td>
              <td>{{ item.quantity }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- <div class="stats-grid">
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
    </div> -->

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
import apexchart from 'vue3-apexcharts'
import productsAPI from '../../api/products'
import ordersAPI from '../../api/orders'
import { store } from '../../store'
import {usersAPI} from '../../api/users'

// produk
const totalProducts = ref(0)
const totalStock = ref(0)
const totalStockDipesan = ref(0)
const totalStockAkhir = ref(0)
// users
const totalUsers = ref(0)
const totalCustomers = ref(0)
const totalGudang = ref(0)
const totalAdmins = ref(0)
const activeUsers = ref(0)
const inactiveUsers = ref(0)

// orders
const pendingToSubmitted = ref(0)
const pendingShipments = ref(0)
const paymentApproval = ref(0)
const orderCancelled = ref(0)
const orderRejected = ref(0)
const shippedOrders = ref(0)
const receivedOrders = ref(0)
const allInvoice = ref(0)

// other
const recentOrders = ref([])
const lowStocks = ref([])
const topProducts = ref([])

const error = ref('')

// 1. Chart Order Per Bulan
const orderChartSeries = ref([
  {
    name: 'Total Order',
    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // Diisi dinamis dari database
  }
])
const orderChartOptions = ref({
  chart: { id: 'order-bulanan', toolbar: { show: false } },
  xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] },
  stroke: { curve: 'smooth', width: 3 },
  colors: ['#4F46E5'],
  markers: { size: 4 }
})

// 2. Chart Pergerakan Stok
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


    // product
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

    // users
    const usersRes = await usersAPI.getAll()

    const users = usersRes.data.data

    totalUsers.value = users.length

    totalCustomers.value =
      users.filter(
        u => u.role === 'mahasiswa'
      ).length

    totalGudang.value =
      users.filter(
        u => u.role === 'gudang'
      ).length

    totalAdmins.value =
      users.filter(
        u => u.role === 'admin'
      ).length

    activeUsers.value =
      users.filter(
        u => u.is_active
      ).length

    inactiveUsers.value =
      users.filter(
        u => !u.is_active
      ).length

    // orders
    const ordersRes = await ordersAPI.getAllOrders()
    const orders = ordersRes.data.data || []
    allInvoice.value = orders.length
    pendingToSubmitted.value = orders.filter(o => o.status === 'pending').length    
    pendingShipments.value = orders.filter(o => o.status === 'payment_submitted').length
    paymentApproval.value = orders.filter(o => o.status === 'payment_approved').length    
    shippedOrders.value = orders.filter(o => o.status === 'shipped').length
    receivedOrders.value = orders.filter(o => o.status === 'received').length
    orderRejected.value = orders.filter(o => o.status === 'rejected').length
    orderCancelled.value = orders.filter(o => o.status === 'cancelled').length 

    // cart order per bulan
    const monthlyData = Array(12).fill(0) 
    
    orders.forEach(order => {
      if (order.order_date) {
        const date = new Date(order.order_date)
        if (!isNaN(date.getTime())) {
          const monthIndex = date.getMonth() 
          monthlyData[monthIndex]++
        }
      }
    })
    
    
    orderChartSeries.value = [
      { name: 'Total Order', data: monthlyData }
    ]

    // other
    recentOrders.value =
      orders
        .sort(
          (a, b) =>
            new Date(b.order_date) -
            new Date(a.order_date)
        )
        .slice(0, 5)

    lowStocks.value =
      products
        .filter(
          p => Number(p.stock_akhir || 0) < 100
        )
        .slice(0, 5)
    const getTopSellingProduct = await productsAPI.topSelling()
    const topProductsData = getTopSellingProduct.data.data || []
    topProducts.value = topProductsData
      
    
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
.welcome-section {
  background: linear-gradient(135deg, var(--secondary) 0%, #3b82f6 100%);
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
.chart-container {
  width: 100%;
  height: 280px; /* Mengatur tinggi konstan area chart di dalam card */
  margin-top: 15px;
}
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