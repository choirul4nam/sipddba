import { createRouter, createWebHistory } from 'vue-router'
import { store } from './store'

// Public pages
import CatalogPage from './pages/CatalogPage.vue'
import LoginPage from './pages/LoginPage.vue'
import RegisterPage from './pages/RegisterPage.vue'
import ProfilePage from './pages/ProfilePage.vue'

// Mahasiswa pages
import MahasiswaDashboard from './pages/mahasiswa/Dashboard.vue'
import OrdersPage from './pages/orders/Orders.vue'
import CartPage from './pages/mahasiswa/Cart.vue'
import OrderDetailPage from './pages/orders/OrderDetail.vue'

// Gudang pages
import GudangDashboard from './pages/gudang/Dashboard.vue'
import ProductsPage from './pages/masters/Products.vue'
import ShipmentsPage from './pages/gudang/Shipments.vue'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard.vue'
import AdminUsers from './pages/admin/Users.vue'
import AdminPayments from './pages/admin/Payments.vue'
import AdminReports from './pages/admin/Reports.vue'

const routes = [
  // Public routes
  {
    path: '/',
    component: CatalogPage,
    name: 'home'
  },
  {
    path: '/catalog',
    component: CatalogPage,
    name: 'catalog'
  },
  {
    path: '/login',
    component: LoginPage,
    name: 'login',
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    component: RegisterPage,
    name: 'register',
    meta: { requiresGuest: true }
  },
  {
    path: '/profile',
    component: ProfilePage,
    name: 'profile',
    meta: { requiresAuth: true }
  },

  {
    path: '/orders/:status?',
    component: OrdersPage,
    name: 'orders',
    meta: { requiresAuth: true, roles: ['mahasiswa', 'admin', 'gudang'] }
  },

  // Mahasiswa routes
  {
    path: '/dashboard',
    component: MahasiswaDashboard,
    name: 'mahasiswa-dashboard',
    meta: { requiresAuth: true, roles: ['mahasiswa'] }
  },
  {
    path: '/orders',
    component: OrdersPage,
    name: 'orders',
    meta: { requiresAuth: true, roles: ['mahasiswa', 'admin', 'gudang'] }
  },
  {
    path: '/orders/:id',
    component: OrderDetailPage,
    name: 'order-detail',
    meta: { requiresAuth: true, roles: ['mahasiswa', 'admin', 'gudang'] }
  },
  {
    path: '/cart',
    component: CartPage,
    name: 'cart',
    meta: { requiresAuth: true, roles: ['mahasiswa'] }
  },

  // Gudang routes
  {
    path: '/gudang/dashboard',
    component: GudangDashboard,
    name: 'gudang-dashboard',
    meta: { requiresAuth: true, roles: ['gudang'] }
  },
  {
    path: '/products',
    component: ProductsPage,
    name: 'products',
    meta: { requiresAuth: true, roles: ['gudang', 'admin']}
  },
  {
    path: '/shipments',
    component: ShipmentsPage,
    name: 'shipments',
    meta: { requiresAuth: true, roles: ['gudang'] }
  },

  // Admin routes
  {
    path: '/admin/dashboard',
    component: AdminDashboard,
    name: 'admin-dashboard',
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/admin/users',
    component: AdminUsers,
    name: 'admin-users',
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/admin/payments',
    component: AdminPayments,
    name: 'admin-payments',
    meta: { requiresAuth: true, roles: ['admin'] }
  },
  {
    path: '/admin/reports',
    component: AdminReports,
    name: 'admin-reports',
    meta: { requiresAuth: true, roles: ['admin'] }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from) => {
  if (to.meta.requiresGuest && store.isAuthenticated) {
    return '/'
  } else if (to.meta.requiresAuth && !store.isAuthenticated) {
    return '/login'
  } else if (to.meta.roles && !to.meta.roles.includes(store.user?.role)) {
    return '/login'
  }
  // return true / undefined = lanjut
})

export default router
