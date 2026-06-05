<template>
  <div class="cart-container">
    <h1>Shopping Cart</h1>

    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="store.cart.length > 0">
      <div class="cart-items">
        <div 
          v-for="item in store.cart"
          :key="item.id"
          class="cart-item"
        >
          <div class="item-info">
            <h4>{{ item.name }}</h4>
            <p class="item-category">{{ item.category }}</p>
          </div>

          <div class="item-quantity">
            <button @click="decreaseQuantity(item.id)" class="qty-btn">−</button>
            <input 
              v-model.number="item.quantity"
              type="number"
              @change="updateQuantity(item.id, item.quantity)"
              class="qty-input"
            />
            <button @click="increaseQuantity(item.id)" class="qty-btn">+</button>
          </div>

          <div class="item-price">
            Rp {{ formatPrice(item.unit_price * item.quantity) }}
          </div>

          <button 
            @click="removeItem(item.id)"
            class="btn btn-danger btn-sm"
          >
            Remove
          </button>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>Rp {{ formatPrice(getCartTotal()) }}</span>
        </div>
        <div class="summary-row">
          <span>Tax (0%):</span>
          <span>Rp 0</span>
        </div>
        <div class="summary-row total">
          <span>Total:</span>
          <span>Rp {{ formatPrice(getCartTotal()) }}</span>
        </div>

        <button 
          @click="handleCheckout"
          class="btn btn-primary btn-block"
          :disabled="loading"
        >
          <span v-if="!loading">Proceed to Checkout</span>
          <span v-else>Processing...</span>
        </button>
        <router-link to="/catalog" class="btn btn-outline btn-block">
          Continue Shopping
        </router-link>
      </div>
    </div>

    <div v-else class="empty-cart">
      <p>Your cart is empty</p>
      <router-link to="/catalog" class="btn btn-primary">
        Start Shopping
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ordersAPI from '../../api/orders'
import { store } from '../../store'


const router = useRouter()
const error = ref('')
const loading = ref(false)

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID').format(price)
}

const getCartTotal = () => {
  return store.getCartTotal()
}

const increaseQuantity = (productId) => {
  const item = store.cart.find(
    i => i.id === productId
  )

  if (item) {
    item.quantity++

    localStorage.setItem(
      'cart',
      JSON.stringify(store.cart)
    )
  }
}

const decreaseQuantity = (productId) => {
  const item = store.cart.find(
    i => i.id === productId
  )

  if (item && item.quantity > 1) {
    item.quantity--

    localStorage.setItem(
      'cart',
      JSON.stringify(store.cart)
    )
  }
}

const updateQuantity = (
  productId,
  newQuantity
) => {
  const item = store.cart.find(
    i => i.id === productId
  )

  if (item) {
    if (newQuantity < 1) {
      item.quantity = 1
    }

    localStorage.setItem(
      'cart',
      JSON.stringify(store.cart)
    )
  }
}

const removeItem = (productId) => {
  store.removeFromCart(productId)
}

const handleCheckout = async () => {
  if (store.cart.length === 0) {
    error.value = 'Your cart is empty'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const items = store.cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }))

    const response = await ordersAPI.create({ items })
    
    store.clearCart()
    alert('Order created successfully!')
    router.push(`/orders/${response.data.data.id}`)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to create order'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.cart-container {
  padding: var(--spacing-xl) 0;
}

.cart-container h1 {
  margin-bottom: var(--spacing-xl);
}

.cart-items {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-lg);
  overflow: hidden;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.cart-item:last-child {
  border-bottom: none;
}

.item-info {
  flex: 1;
  min-width: 200px;
}

.item-info h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 1rem;
}

.item-category {
  color: #666;
  font-size: 0.875rem;
  margin: 0;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.qty-btn {
  background: none;
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  font-size: 1.125rem;
  color: var(--primary);
  transition: background-color 0.2s;
}

.qty-btn:hover {
  background-color: var(--light);
}

.qty-input {
  width: 50px;
  border: none;
  text-align: center;
  font-weight: 600;
  padding: var(--spacing-sm) !important;
}

.qty-input:focus {
  box-shadow: none !important;
}

.item-price {
  min-width: 150px;
  text-align: right;
  font-weight: 600;
  color: var(--primary);
  font-size: 1.125rem;
}

.cart-summary {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  max-width: 400px;
  margin-left: auto;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--border);
}

.summary-row.total {
  border-bottom: none;
  font-weight: 700;
  font-size: 1.125rem;
  padding: var(--spacing-md) 0;
  color: var(--primary);
}

.btn-block {
  width: 100%;
  margin-top: var(--spacing-md);
}

.empty-cart {
  text-align: center;
  padding: var(--spacing-2xl);
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.empty-cart p {
  margin-bottom: var(--spacing-lg);
  color: #666;
  font-size: 1.125rem;
}

@media (max-width: 768px) {
  .cart-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-md);
  }

  .item-price,
  .item-quantity {
    width: 100%;
  }

  .item-price {
    text-align: left;
  }

  .cart-summary {
    max-width: 100%;
  }
}
</style>
