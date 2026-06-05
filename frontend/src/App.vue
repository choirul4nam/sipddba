<template>
  <div id="app" class="app-container">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="navbar-container">
        <router-link to="/" class="navbar-brand">
          <span class="navbar-logo">📚 Distribusi Bahan Ajar</span>
        </router-link>
        
        <button 
          @click="toggleMobileMenu" 
          class="navbar-toggle"
          v-if="isMobileMenuOpen === false"
        >
          ☰
        </button>
        <button 
          @click="toggleMobileMenu" 
          class="navbar-toggle"
          v-else
        >
          ✕
        </button>

        <ul class="navbar-menu" :class="{ active: isMobileMenuOpen }">
          <!-- Public menu -->
           <li v-if="!store.isAuthenticated">
            <router-link to="/catalog" @click="closeMobileMenu">Catalog</router-link>
          </li>

          <!-- Mahasiswa menu -->
          <li v-if="store.isAuthenticated && store.user?.role === 'mahasiswa'">
            <router-link to="/dashboard" @click="closeMobileMenu">Dashboard</router-link>
          </li>
          <li v-if="store.isAuthenticated && store.user?.role === 'mahasiswa'">
            <router-link to="/catalog" @click="closeMobileMenu">Catalog</router-link>
          </li>
          <li v-if="store.isAuthenticated && store.user?.role === 'mahasiswa'">
            <router-link to="/orders" @click="closeMobileMenu">My Orders</router-link>
          </li>
          <li v-if="store.isAuthenticated && store.user?.role === 'mahasiswa'">
            <router-link to="/cart" @click="closeMobileMenu">Cart ({{ store.cart.length }})</router-link>
          </li>

          <!-- Gudang menu -->
          <li v-if="store.isAuthenticated && store.user?.role === 'gudang'">
            <router-link to="/gudang/dashboard" @click="closeMobileMenu">Dashboard</router-link>
          </li>
          <li v-if="store.isAuthenticated && store.user?.role === 'gudang'">
            <router-link to="/products" @click="closeMobileMenu">Master Produk</router-link>
          </li>
          <li v-if="store.isAuthenticated && store.user?.role === 'gudang'">
            <router-link to="/orders?status=payment_approved" @click="closeMobileMenu">Proses Pengiriman</router-link>
          </li>

          <!-- Admin menu -->
          <li v-if="store.isAuthenticated && store.user?.role === 'admin'">
            <router-link to="/admin/dashboard" @click="closeMobileMenu">Dashboard</router-link>
          </li>
          <li v-if="store.isAuthenticated && store.user?.role === 'admin'">
            <router-link to="/products" @click="closeMobileMenu">Products</router-link>
          </li>
          <li v-if="store.isAuthenticated && store.user?.role === 'admin'">
            <router-link to="/admin/users" @click="closeMobileMenu">Users</router-link>
          </li>
          <li v-if="store.isAuthenticated && store.user?.role === 'admin'">
            <router-link to="/orders" @click="closeMobileMenu">Orders</router-link>
          </li>                    
          <li v-if="store.isAuthenticated && store.user?.role === 'admin'">
            <router-link to="/admin/reports" @click="closeMobileMenu">Reports</router-link>
          </li>

          <!-- Auth menu -->
          <li v-if="!store.isAuthenticated">
            <router-link to="/login" @click="closeMobileMenu">Login</router-link>
          </li>
          <li v-if="!store.isAuthenticated">
            <router-link to="/register" @click="closeMobileMenu">Register</router-link>
          </li>
          <li v-if="store.isAuthenticated" class="user-menu">
            <span>{{ store.user?.full_name }}</span>
            <div class="dropdown">
              <router-link to="/profile" @click="closeMobileMenu">Profile</router-link>
              <a href="#" @click="handleLogout">Logout</a>
            </div>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <p>&copy; 2024 Sistem Distribusi Bahan Ajar. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { store } from './store'

const router = useRouter()
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleLogout = (e) => {
  e.preventDefault()
  store.logout()
  router.push('/login')
  closeMobileMenu()
}
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Navigation Bar */
.navbar {
  background-color: var(--primary);
  color: white;
  padding: var(--spacing-md) 0;
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
}

.navbar-logo {
  display: inline-block;
}

.navbar-menu {
  display: flex;
  list-style: none;
  gap: var(--spacing-lg);
  align-items: center;
  margin: 0;
  padding: 0;
}

.navbar-menu a {
  color: white;
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: background-color 0.2s;
}

.navbar-menu a:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.navbar-menu a.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.user-menu {
  position: relative;
}

.user-menu > span {
  cursor: pointer;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  transition: background-color 0.2s;
}

.user-menu:hover > span {
  background-color: rgba(255, 255, 255, 0.1);
}

.dropdown {
  display: none;
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  color: var(--text);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  min-width: 150px;
  z-index: 101;
}

.user-menu:hover .dropdown {
  display: block;
}

.dropdown a {
  display: block;
  color: var(--text);
  padding: var(--spacing-md);
  text-decoration: none;
  border-bottom: 1px solid var(--border);
}

.dropdown a:last-child {
  border-bottom: none;
}

.dropdown a:hover {
  background-color: var(--light);
  color: var(--primary);
}

.navbar-toggle {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
}

/* Main Content */
.main-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: var(--spacing-xl) var(--spacing-md);
}

/* Footer */
.footer {
  background-color: var(--dark);
  color: white;
  padding: var(--spacing-xl) var(--spacing-md);
  margin-top: auto;
  text-align: center;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .navbar-menu {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background-color: var(--primary-dark);
    gap: 0;
    width: 100%;
    border-radius: 0;
  }

  .navbar-menu.active {
    display: flex;
  }

  .navbar-menu a {
    width: 100%;
    padding: var(--spacing-md);
    border-radius: 0;
    display: block;
  }

  .navbar-toggle {
    display: block;
  }

  .user-menu .dropdown {
    position: static;
    display: none;
    background-color: var(--primary-dark);
    box-shadow: none;
  }

  .user-menu:hover .dropdown,
  .user-menu.active .dropdown {
    display: block;
  }

  .dropdown a {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }

  .main-content {
    padding: var(--spacing-lg) var(--spacing-md);
  }
}
</style>
