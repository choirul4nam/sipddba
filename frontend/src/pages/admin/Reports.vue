<!-- <template>
  <div class="reports-container">
    <h1>Reports</h1>
    <div class="alert alert-info">
      <p>🚀 Reports & Analytics - Coming Soon</p>
      <p>Fitur: Stock reports, sales reports, user activity</p>
    </div>
    <router-link to="/admin/dashboard" class="btn btn-outline">← Kembali</router-link>
  </div>
</template>

<style scoped>
.reports-container { padding: var(--spacing-xl) 0; }
</style> -->

<template>
  <div class="reports-container">
    <div class="page-header">
      <h1>🚀 Reports & Analytics</h1>
      <!-- <div class="export-actions">
        <button class="btn btn-secondary" @click="exportToExcel">📥 Ekspor Excel</button>
        <button class="btn btn-primary" @click="printReport">🖨️ Cetak PDF</button>
      </div> -->
    </div>

    <div class="report-tabs">
      <button 
        :class="['tab-btn', { active: activeTab === 'stok' }]" 
        @click="activeTab = 'stok'"
      >📦 Laporan Stok</button>
      <button 
        :class="['tab-btn', { active: activeTab === 'sales' }]" 
        @click="activeTab = 'sales'"
      >💰 Laporan Penjualan</button>
      <button 
        :class="['tab-btn', { active: activeTab === 'users' }]" 
        @click="activeTab = 'users'"
      >👥 Aktivitas User</button>
    </div>

    <div v-if="loading" class="loading-state">Memuat data laporan...</div>

    <div v-else class="report-content">
      <div v-if="activeTab === 'stok'" class="tab-panel">
        <div class="analytics-grid">
          <div class="chart-card">
            <h3>Ringkasan Ketersediaan Stok Akhir</h3>
            <div class="chart-container">
              <apexchart type="bar" height="100%" width="100%" :options="stockChartOptions" :series="stockChartSeries"></apexchart>
            </div>
          </div>
        </div>

        <div class="card table-card">
          <h3>Tabel Detail Logistik Stok</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Produk</th>
                <th>Stok On Hand</th>
                <th>Stok Dipesan</th>
                <th>Sisa Stok Akhir</th>
                <th>Status Kritis</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in stockData" :key="p.id">
                <td><code>{{ p.code }}</code></td>
                <td>{{ p.name }}</td>
                <td>{{ p.stock_onhand }}</td>
                <td>{{ p.stock_order }}</td>
                <td :class="{ 'text-danger': p.stock_akhir < 10 }"><strong>{{ p.stock_akhir }}</strong></td>
                <td>
                  <span :class="['badge', p.stock_akhir < 20 ? 'badge-danger' : 'badge-success']">
                    {{ p.stock_akhir < 20 ? 'Perlu Restock' : 'Aman' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'sales'" class="tab-panel">
        <div class="analytics-grid">
          <div class="chart-card">
            <h3>Tren Akumulasi Omset Bulanan</h3>
            <div class="chart-container">
              <apexchart type="area" height="100%" width="100%" :options="salesChartOptions" :series="salesChartSeries"></apexchart>
            </div>
          </div>
        </div>

        <div class="card table-card">
          <h3>Rekapitulasi Faktur Transaksi</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Nomor Order</th>
                <th>Pemesan</th>
                <th>Tanggal</th>
                <th>Total Item</th>
                <th>Nilai Transaksi</th>
                <th>Status Terakhir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="o in salesData" :key="o.id">
                <td><strong>{{ o.order_number }}</strong></td>
                <td>{{ o.full_name }}</td>
                <td>{{ formatDate(o.order_date) }}</td>
                <td>{{ o.item_count }} Item</td>
                <td>Rp {{ Number(o.total_amount).toLocaleString('id-ID') }}</td>
                <td><span :class="['badge', 'status-' + o.status]">{{ o.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="activeTab === 'users'" class="tab-panel">
        <div class="card table-card">
          <h3>Log Audit Sistem Pengguna</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Nama Pengguna</th>
                <th>Email</th>
                <th>Hak Akses Role</th>
                <th>Status Akun</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in userData" :key="u.id">
                <td>{{ u.full_name }}</td>
                <td>{{ u.email }}</td>
                <td><span class="role-tag">{{ u.role }}</span></td>
                <td>
                  <span :class="['indicator', u.is_active ? 'active' : 'inactive']"></span>
                  {{ u.is_active ? 'Aktif Sistem' : 'Nonaktif' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import apexchart from 'vue3-apexcharts'
import productsAPI from '../../api/products'
import ordersAPI from '../../api/orders'
import { usersAPI } from '../../api/users'

const activeTab = ref('stok')
const loading = ref(false)

// Raw Data Repositories
const stockData = ref([])
const salesData = ref([])
const userData = ref([])

// ApexCharts Reactive Configs
const stockChartSeries = ref([{ name: 'Sisa Stok Akhir', data: [] }])
const stockChartOptions = ref({
  chart: { id: 'report-stok-bar', toolbar: { show: false } },
  colors: ['#6366F1'],
  xaxis: { categories: [] },
  plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } }
})

const salesChartSeries = ref([{ name: 'Total Pendapatan', data: [] }])
const salesChartOptions = ref({
  chart: { id: 'report-sales-area', toolbar: { show: false } },
  colors: ['#10B981'],
  stroke: { curve: 'smooth', width: 3 },
  xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'] },
  dataLabels: { enabled: false }
})

const loadReportData = async () => {
  loading.value = true
  try {
    // 1. Ambil Data Manajemen Stok
    const prodRes = await productsAPI.getWithStock()
    stockData.value = prodRes.data.data || []
    
    stockChartOptions.value = {
      ...stockChartOptions.value,
      xaxis: { categories: stockData.value.slice(0, 8).map(p => p.name) }
    }
    stockChartSeries.value = [{ name: 'Sisa Stok Akhir', data: stockData.value.slice(0, 8).map(p => Number(p.stock_akhir || 0)) }]

    // 2. Ambil Data Penjualan (Orders)
    const orderRes = await ordersAPI.getAllOrders()
    salesData.value = orderRes.data.data || []

    const monthlyRevenue = Array(12).fill(0)
    salesData.value.forEach(order => {
      if (order.order_date && order.status !== 'cancelled' && order.status !== 'rejected') {
        const month = new Date(order.order_date).getMonth()
        monthlyRevenue[month] += parseFloat(order.total_amount || 0)
      }
    })
    salesChartSeries.value = [{ name: 'Total Pendapatan', data: monthlyRevenue }]

    // 3. Ambil Data Konfigurasi Users
    const userRes = await usersAPI.getAll()
    userData.value = userRes.data.data || []

  } catch (error) {
    console.error('Error memproses analitik laporan:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
}

const printReport = () => {
  window.print()
}

const exportToExcel = () => {
  alert('Fitur ekspor ke format .xlsx sedang disiapkan menggunakan library SheetJS!')
}

onMounted(() => {
  loadReportData()
})
</script>
<style scoped>
.reports-container {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.export-actions {
  display: flex;
  gap: 12px;
}

/* Tab Navigation */
.report-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 8px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
}

.tab-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.tab-btn.active {
  color: #4f46e5;
  background: #eeebff;
}

/* Analytics Layout */
.analytics-grid {
  margin-bottom: 24px;
}

.chart-card {
  background: #ffffff;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.chart-container {
  height: 320px;
  width: 100%;
  margin-top: 16px;
}

/* Table Card Customization */
.card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
}

.table-card h3 {
  margin-bottom: 16px;
  color: #1e293b;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background: #f8fafc;
  color: #64748b;
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid #edf2f7;
  color: #334155;
  font-size: 0.95rem;
}

/* Badges & Status Indicators */
.badge {
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}
.badge-danger { background: #fee2e2; color: #ef4444; }
.badge-success { background: #dcfce7; color: #10b981; }

.status-pending { background: #fef3c7; color: #d97706; }
.status-payment_approved { background: #e0e7ff; color: #4f46e5; }
.status-shipped { background: #e0f2fe; color: #0284c7; }
.status-received { background: #dcfce7; color: #15803d; }

.indicator {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}
.indicator.active { background: #10b981; }
.indicator.inactive { background: #94a3b8; }

.role-tag {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}
.btn-primary { background: #4f46e5; color: white; }
.btn-secondary { background: #ffffff; border-color: #cbd5e1; color: #475569; }

.text-danger { color: #ef4444; }
.loading-state { text-align: center; padding: 40px; color: #64748b; font-weight: 500; }

/* CSS Khusus Cetak PDF via Browser */
@media print {
  .export-actions, .report-tabs { display: none !important; }
  .reports-container { padding: 0; background: white; }
  .chart-card, .card { border: none; box-shadow: none; }
}
</style>
