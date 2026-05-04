import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'

const CartContext = createContext()

const CART_STORAGE_KEY = 'streetstars_cart'
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 dias

const storage = {
  get: (key) => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null

      const parsed = JSON.parse(raw)

      // Suporte ao formato legado (array puro, sem envelope)
      if (Array.isArray(parsed)) return parsed

      // Formato novo: { items, savedAt }
      const { items, savedAt } = parsed
      if (!Array.isArray(items) || !savedAt) return null

      const expired = Date.now() - savedAt > CART_TTL_MS
      if (expired) {
        localStorage.removeItem(key)
        return null
      }

      return items
    } catch (error) {
      console.error('Erro ao ler localStorage:', error)
      return null
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        items: value,
        savedAt: Date.now(),
      }))
      return true
    } catch (error) {
      console.error('Erro ao salvar localStorage:', error)
      return false
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Erro ao remover localStorage:', error)
      return false
    }
  },
}

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false)

  const [cartItems, setCartItems] = useState(() => {
    return storage.get(CART_STORAGE_KEY) || []
  })

  useEffect(() => {
    storage.set(CART_STORAGE_KEY, cartItems)
  }, [cartItems])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CART_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          const items = Array.isArray(parsed) ? parsed : parsed?.items ?? []
          setCartItems(items)
        } catch (error) {
          console.error('Erro ao sincronizar carrinho:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const addToCart = useCallback((product, size, color) => {
    setCartItems(prev => {
      const existingItem = prev.find(item =>
        item.id === product.id &&
        item.size === size &&
        item.color === color
      )

      if (existingItem) {
        return prev.map(item =>
          item.id === product.id && item.size === size && item.color === color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...prev, { ...product, size, color, quantity: 1 }]
    })
    setIsCartOpen(true)
  }, [])

  const removeFromCart = useCallback((id, size, color) => {
    setCartItems(prev =>
      prev.filter(item =>
        !(item.id === id && item.size === size && item.color === color)
      )
    )
  }, [])

  const updateQuantity = useCallback((id, size, color, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id, size, color)
      return
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id && item.size === size && item.color === color
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }, [removeFromCart])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const cartCount = useMemo(() =>
    cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  )

  const cartTotal = useMemo(() =>
    cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0),
    [cartItems]
  )

  const value = useMemo(() => ({
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
  }), [cartItems, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal])

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart deve ser usado dentro de CartProvider')
  }

  return context
}