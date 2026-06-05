import { reactive } from 'vue'

export const store = reactive({
  // Auth state
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  // Cart state
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),

  // Methods
  setUser(user, token) {
    this.user = user
    this.token = token
    this.isAuthenticated = true
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  },

  logout() {
    this.user = null
    this.token = null
    this.isAuthenticated = false
    this.cart = []

    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('cart')
  },

  addToCart(product, quantity) {
    const existingItem = this.cart.find(
      item => item.id === product.id
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      this.cart.push({
        ...product,
        quantity
      })
    }

    localStorage.setItem(
      'cart',
      JSON.stringify(this.cart)
    )
  },

  removeFromCart(productId) {
    this.cart = this.cart.filter(
      item => item.id !== productId
    )

    localStorage.setItem(
      'cart',
      JSON.stringify(this.cart)
    )
  },

  clearCart() {
    this.cart = []

    localStorage.removeItem('cart')
  },

  getCartTotal() {
    return this.cart.reduce((total, item) => total + (item.unit_price * item.quantity), 0)
  }
})
