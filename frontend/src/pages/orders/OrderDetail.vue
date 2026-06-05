<template>
  <div class="order-detail-container">
    <router-link :to="route.query.status
    ? `/orders?status=${route.query.status}`
    : '/orders'" class="back-link">← Back to Orders</router-link>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-else-if="order" class="order-detail">
      <div class="order-header">
        <div>
          <h1>Order {{ order.order_number }}</h1>
          <p class="order-date">{{ formatDate(order.order_date) }}</p>
        </div>
        <span :class="['status-badge', `status-${order.status}`]">
          {{ formatStatus(order.status) }}
        </span>
      </div>

      <div class="order-content">
        <div class="section">
          <h3>Items Ordered</h3>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.items" :key="item.id">
                <td>{{ item.name }}</td>
                <td>{{ item.quantity }}</td>
                <td>Rp {{ formatPrice(item.unit_price) }}</td>
                <td>Rp {{ formatPrice(item.subtotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Order Summary</h3>
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>Rp {{ formatPrice(order.total_amount) }}</span>
            </div>
            <div class="summary-row">
              <span>Tax:</span>
              <span>Rp 0</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>Rp {{ formatPrice(order.total_amount) }}</span>
            </div>
          </div>

          
        </div>    

        <div class="section">
          <h3>Shipping Information</h3>
          <div class="info-grid">
            <div>
              <p class="label">Customer Name</p>
              <p>{{ order.full_name }}</p>
            </div>
            <div>
              <p class="label">Email</p>
              <p>{{ order.email }}</p>
            </div>
            <div>
              <p class="label">Phone</p>
              <p>{{ order.phone_number }}</p>
            </div>
            <div>
              <p class="label">Address</p>
              <p>{{ order.address }}</p>
            </div>
          </div>
        </div>

        <div v-if="payment" class="section">
          <h3>Payment Document</h3>

          <p>
            Status:
            <strong>{{ payment.status }}</strong>
          </p>

          <p>
            Type:
            {{ payment.document_type }}
          </p>

          <div v-if="payment.file_url">

            <img
              v-if="!isPdf(payment.file_url)"
              :src="payment.file_url"
              class="payment-image"
            />

            <a
              v-else
              :href="payment.file_url"
              target="_blank"
              class="btn btn-primary"
            >
              Lihat PDF
            </a>

          </div>
        </div>

        <div
          v-if="
            store.user?.role === 'admin' &&
            order.status === 'payment_submitted'
          "
          class="section"
        >
          <h3>Approval Pembayaran</h3>

          <div class="button-group">
            <button
              class="btn btn-success"
              @click="handleApprove"
              :disabled="approveLoading"
            >
              <span v-if="!approveLoading">
                Approve Payment
              </span>
              <span v-else>
                Processing...
              </span>
            </button>

            <button
              class="btn btn-danger"
              @click="handleReject"
              :disabled="rejectLoading"
            >
              <span v-if="!rejectLoading">
                Reject Payment
              </span>
              <span v-else>
                Processing...
              </span>
            </button>
          </div>
        </div>

        <div
          v-if="
            store.user?.role === 'gudang' &&
            order.status === 'payment_approved'
          "
          class="section"
        >
          <h3>Approval Pembayaran</h3>

          <div class="button-group">
            <button
              class="btn btn-success"
              @click="prosesPengiriman"
              :disabled="approveLoading"
            >
              <span v-if="!approveLoading">
                Proses Pengiriman
              </span>
              <span v-else>
                Processing...
              </span>
            </button>

            <!-- <button
              class="btn btn-danger"
              @click="handleReject"
              :disabled="rejectLoading"
            >
              <span v-if="!rejectLoading">
                Reject Payment
              </span>
              <span v-else>
                Processing...
              </span>
            </button> -->
          </div>
        </div>

        <div v-if="
            store.user?.role === 'mahasiswa' &&
            order.status === 'pending'
          "
         class="section payment-section">
          <h3>Payment Proof</h3>
          <form @submit.prevent="handleUploadProof">
            <div class="form-group">
              <label for="proof">Upload Payment Proof (JPG, PNG, PDF)</label>
              <input 
                ref="fileInput"
                type="file" 
                id="proof"
                accept="image/jpeg,image/png,application/pdf"
                @change="handleFileSelect"
              />
            </div>
            <button type="submit" class="btn btn-primary" :disabled="uploadLoading">
              <span v-if="!uploadLoading">Upload Proof</span>
              <span v-else>Uploading...</span>
            </button>
          </form>
        </div>

        <div v-if="store.user?.role === 'mahasiswa' && order.status === 'shipped'" class="section">
         
          <button 
            @click="handleMarkAsReceived"
            class="btn btn-success"
            :disabled="receiveLoading"
          >

            <span v-if="!receiveLoading">Mark as Received</span>
            <span v-else>Processing...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ordersAPI from '../../api/orders'
import paymentsAPI from '../../api/payments'
import { store } from '../../store'


const route = useRoute()
const order = ref(null)
const loading = ref(true)
const error = ref('')
const uploadLoading = ref(false)
const receiveLoading = ref(false)
const selectedFile = ref(null)
const fileInput = ref(null)
const payment = ref(null)


const approveLoading = ref(false)
const rejectLoading = ref(false)
const prosesPengirimanLoading = ref(false)

const loadPayment = async () => {
  try {
    const res = await paymentsAPI.getByOrderId(order.value.id)
    payment.value = res.data.data
    
  } catch (err) {
    payment.value = null
  }
}

const isPdf = (url) => {
  return url?.toLowerCase().endsWith('.pdf')
}

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

const handleFileSelect = (e) => {
  selectedFile.value = e.target.files[0]
}

const handleUploadProof = async () => {
  if (!selectedFile.value) {
    error.value = 'Please select a file'
    return
  }

  uploadLoading.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('document', selectedFile.value)
    formData.append('document_type', 'transfer_proof')

    await paymentsAPI.uploadProof(order.value.id, formData)
    alert('Payment proof uploaded successfully!')
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    loadOrder()
  } catch (err) {
    error.value = 'Failed to upload proof'
    console.error(err)
  } finally {
    uploadLoading.value = false
  }
}

const handleMarkAsReceived = async () => {
  if (confirm('Mark this order as received?')) {
    receiveLoading.value = true
    try {
      await ordersAPI.markAsReceived(order.value.id)
      alert('Order marked as received!')
      loadOrder()
    } catch (err) {
      error.value = 'Failed to mark as received'
      console.error(err)
    } finally {
      receiveLoading.value = false
    }
  }
}

const prosesPengiriman = async () => {
  if (!confirm('Apakah Mau Proses Pengiriman Transaksi Berikut?')) return

  prosesPengirimanLoading.value = true
  try {
    await ordersAPI.updateStatus(order.value.id, 'shipped')    

    alert('Transaksi Berhasil diproses pengiriman')

    await loadOrder()
  } catch (err) {
    console.error(err)
    error.value =
      err.response?.data?.message ||
      'Gagal proses pengiriman'
  } finally {
    approveLoading.value = false
  }
}

const handleApprove = async () => {
  if (!confirm('Approve pembayaran ini?')) return

  approveLoading.value = true

  try {
    await ordersAPI.updateStatus(order.value.id, 'payment_approved')
    await paymentsAPI.approve(payment.value.id)

    alert('Pembayaran berhasil diapprove')

    await loadOrder()
  } catch (err) {
    console.error(err)
    error.value =
      err.response?.data?.message ||
      'Gagal approve pembayaran'
  } finally {
    approveLoading.value = false
  }
}

const handleReject = async () => {
  if (!confirm('Reject pembayaran ini?')) return

  rejectLoading.value = true

  try {
    await ordersAPI.updateStatus(order.value.id, 'rejected')
    await paymentsAPI.reject(payment.value.id)

    alert('Pembayaran berhasil direject')

    await loadOrder()
  } catch (err) {
    console.error(err)
    error.value =
      err.response?.data?.message ||
      'Gagal reject pembayaran'
  } finally {
    rejectLoading.value = false
  }
}

const loadOrder = async () => {
  try {
    const response = await ordersAPI.getById(route.params.id)
    order.value = response.data.data
    await loadPayment()
    
  } catch (err) {
    error.value = 'Failed to load order'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.order-detail-container {
  padding: var(--spacing-xl) 0;
}

.back-link {
  display: inline-block;
  margin-bottom: var(--spacing-lg);
  color: var(--primary);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--primary-dark);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-lg);
}

.order-detail {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.order-header {
  background-color: var(--light);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.order-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.order-date {
  color: #666;
  margin: 0;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
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
.order-content {
  padding: var(--spacing-lg);
}

.section {
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--border);
}

.section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section h3 {
  margin-bottom: var(--spacing-lg);
  color: var(--primary);
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  background-color: var(--light);
  padding: var(--spacing-md);
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid var(--border);
}

.items-table td {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border);
}

.summary {
  background-color: var(--light);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
}

.summary-row.total {
  border-top: 2px solid var(--border);
  padding-top: var(--spacing-md);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--primary);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
}

.info-grid > div p {
  margin: 0;
}

.label {
  font-weight: 600;
  color: var(--dark);
  margin-bottom: var(--spacing-sm) !important;
}

.payment-section {
  background-color: #fef3c7;
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px solid #fde68a;
}

.btn-block {
  width: 100%;
}

@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .items-table {
    font-size: 0.875rem;
  }

  .items-table th,
  .items-table td {
    padding: var(--spacing-sm);
  }
}
.payment-image {
  width: 100%;
  max-width: 600px;
  border-radius: 8px;
  border: 1px solid #ddd;
  margin-top: 12px;
}
</style>
