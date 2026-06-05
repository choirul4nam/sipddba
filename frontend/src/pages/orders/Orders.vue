<template>
  <div class="orders-container">
    <h1>Orders</h1>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else>
      <div v-if="orders.length > 0" class="orders-table">
        <table>
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>{{ order.order_number }}</td>
              <td>{{ formatDate(order.order_date) }}</td>
              <td>Rp {{ formatPrice(order.total_amount) }}</td>
              <td>
                <span :class="['status-badge', `status-${order.status}`]">
                  {{ formatStatus(order.status) }}
                </span>
              </td>
              <td>
                <router-link                   
                  :to="`/orders/${order.id}?status=${route.query.status || 'all'}`"
                  class="btn btn-sm btn-outline"
                >
                  Detail
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <p>No orders yet.</p>
        <router-link v-if="store.user?.role === 'mahasiswa'" to="/catalog"  class="btn btn-primary">
          Start Shopping
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ordersAPI from '../../api/orders'
import { store } from '../../store'
import { useRoute } from 'vue-router'

const route = useRoute()
const selectedStatus = ref('all')

const orders = ref([])
const loading = ref(true)
const error = ref('')

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID')
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID').format(price)
}

const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    payment_submitted: 'Waiting Payment Approval',
    payment_approved: 'Approved',
    shipped: 'Shipped',
    received: 'Received',
    cancelled: 'Cancelled',
    rejected: 'Rejected'
  }
  return statusMap[status] || status
}


const loadOrders = async () => {
  try {
    let response

    if (store.user?.role === 'admin' || store.user?.role === 'gudang') {
      if (selectedStatus.value === 'all') {
        response = await ordersAPI.getAllOrders()
      } else if (selectedStatus.value !== 'pending') {      
        response = await ordersAPI.getByStatus(selectedStatus.value)
      }      
    } else {
      response = await ordersAPI.getMyOrders()
    }
    orders.value = response.data.data || []
  } catch (err) {
    error.value = 'Failed to load orders'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  selectedStatus.value =
    route.query.status || 'all'    
  loadOrders()
})
</script>

<style scoped>
.orders-container {
  padding: var(--spacing-xl) 0;
}

.orders-container h1 {
  margin-bottom: var(--spacing-xl);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-lg);
}

.orders-table {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background-color: var(--light);
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--border);
}

td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}

tr:hover {
  background-color: #fafafa;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-payment_submitted {
  background-color: #dbeafe;
  color: #0c2340;
}

.status-payment_approved {
  background-color: #d1fae5;
  color: #065f46;
}

.status-shipped {
  background-color: #e0e7ff;
  color: #3730a3;
}

.status-received {
  background-color: #dcfce7;
  color: #15803d;
}

.status-rejected {
  background-color: #ff0000;
  color: #ffffff;
}
.status-cancelled {
  background-color: #fee2e2;
  color: #7f1d1d;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.empty-state p {
  margin-bottom: var(--spacing-lg);
  color: #666;
}

@media (max-width: 768px) {
  table {
    font-size: 0.875rem;
  }

  th, td {
    padding: var(--spacing-sm);
  }
}
</style>
