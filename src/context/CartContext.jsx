import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  // 1. Inicializa o carrinho buscando do LocalStorage se existir
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('streetstars_cart')
    return savedCart ? JSON.parse(savedCart) : []
  })

  // 2. Sempre que o cartItems mudar, salva no LocalStorage
  useEffect(() => {
    localStorage.setItem('streetstars_cart', JSON.stringify(cartItems))
  }, [cartItems])

  // --- FUNÇÕES ---

  // Adicionar ao Carrinho (Verifica se já existe o mesmo ID + Tamanho)
  const addToCart = (product, size) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id && item.size === size)

      if (existingItem) {
        // Se já existe, só aumenta a quantidade
        return prev.map(item => 
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      // Se é novo, adiciona ao array
      return [...prev, { ...product, size, quantity: 1 }]
    })
    setIsCartOpen(true)
  }

  // Atualizar Quantidade (+ ou -)
  const updateQuantity = (id, size, newQuantity) => {
    if (newQuantity < 1) {
      // Se for menor que 1, remove o item
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

  // Remover Item
  const removeFromCart = (id, size) => {
    setCartItems(prev => prev.filter(item => !(item.id === id && item.size === size)))
  }

  // Limpar tudo
  const clearCart = () => setCartItems([])

  // --- CÁLCULOS ---
  
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)
  
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider value={{
      cartItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity, // Nova função essencial
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)