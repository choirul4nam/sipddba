<template>
  <div class="catalog-container">
    <h1>Katalog Bahan Ajar</h1>
    
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>

    <div v-else>
      <div class="products-grid">
        <div 
          v-for="product in products" 
          :key="product.id"
          class="product-card"
        >
          <div class="product-image">
            <img 
              v-if="product.image_url"
              :src="product.image_url" 
              :alt="product.name"
            />
            <div v-else class="no-image">📚</div>
          </div>

          <div class="product-content">
            <h3>{{ product.name }}</h3>
            <p class="category">{{ product.category }}</p>
            <p class="description">{{ product.description }}</p>
            
            <div class="product-footer">
              <div class="price">Rp {{ formatPrice(product.unit_price) }}</div>
              
              <button 
                v-if="store.isAuthenticated && store.user?.role === 'mahasiswa'"
                @click="addToCart(product)"
                class="btn btn-primary btn-sm"
              >
                Add to Cart
              </button>
              <router-link v-else to="/login" class="btn btn-outline btn-sm">
                Login to Buy
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <div v-if="products.length === 0" class="empty-state">
        <p>No products available</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import productsAPI from '../api/products'
import { store } from '../store'

const router = useRouter()
const products = ref([])
const loading = ref(true)
const error = ref('')

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID').format(price)
}

const addToCart = (product) => {
  store.addToCart(product, 1)
  alert(`${product.name} ditambahkan ke cart!`)
}

const loadProducts = async () => {
  try {
    const response = await productsAPI.getCatalog()
    products.value = response.data.data || []
  } catch (err) {
    error.value = 'Failed to load products'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.catalog-container {
  padding: var(--spacing-xl) 0;
}

.catalog-container h1 {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-lg);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.product-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.product-image {
  width: 100%;
  height: 200px;
  background-color: var(--light);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  font-size: 3rem;
}

.product-content {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-content h3 {
  margin-bottom: var(--spacing-sm);
  font-size: 1.125rem;
  min-height: 2.25rem;
}

.category {
  color: var(--primary);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.description {
  color: #666;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-md);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border);
}

.price {
  font-weight: 700;
  color: var(--primary);
  font-size: 1.125rem;
}

.product-footer .btn {
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: #999;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: var(--spacing-md);
  }
}
</style>
