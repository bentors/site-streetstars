import { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext({});

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const storedCart = localStorage.getItem('@StreetStars:cart-v1');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (error) {
        console.error("Erro ao recuperar carrinho:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('@StreetStars:cart-v1', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, selectedSize) => {
    if (!selectedSize) {
      alert("Por favor, selecione um tamanho.");
      return;
    }

    setCartItems((prevItems) => {
      const itemExists = prevItems.find(
        (item) => item.id === product.id && item.size === selectedSize
      );

      if (itemExists) {
        return prevItems.map((item) =>
          item.id === product.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevItems, { ...product, size: selectedSize, quantity: 1 }];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId, size) => {
    setCartItems((prevItems) =>
      prevItems.reduce((acc, item) => {
        if (item.id === productId && item.size === size) {
          if (item.quantity === 1) return acc;
          return [...acc, { ...item, quantity: item.quantity - 1 }];
        }
        return [...acc, item];
      }, [])
    );
  };

  const deleteItem = (productId, size) => {
    setCartItems((prevItems) => 
      prevItems.filter((item) => !(item.id === productId && item.size === size))
    );
  };

  const clearCart = () => setCartItems([]);

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        deleteItem,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
};