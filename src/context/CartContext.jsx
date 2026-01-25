import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('streetstars_cart')
    return savedCart ? JSON.parse(savedCart) : []
  })

  useEffect(() => {
    localStorage.setItem('streetstars_cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product, size) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id && item.size === size)

      if (existingItem) {
        return prev.map(item => 
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...prev, { ...product, size, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  const updateQuantity = (id, size, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id, size)
      return
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === id && item.size === size
          ? { ...item, quantity: newQuantity }
          : item
      )
    )
  }

  const removeFromCart = (id, size) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.size === size)))
  }

  const clearCart = () => setCartItems([])
  
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)