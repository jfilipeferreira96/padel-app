import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
}

interface CartContextProps {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  totalPrice: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.product_id === item.product_id);
      if (existingItem) {
        return prevCart.map((cartItem) => (cartItem.product_id === item.product_id ? { ...cartItem, quantity: cartItem.quantity + item.quantity } : cartItem));
      } else {
        return [...prevCart, item];
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter((item) => item.product_id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    setCart(cart.map((item) => (item.product_id === itemId ? { ...item, quantity } : item)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    const storedTimestamp = localStorage.getItem("cartTimestamp");

    if (storedCart && storedTimestamp) {
      const parsedTimestamp = parseInt(storedTimestamp, 10);
      const currentTimestamp = Math.floor(Date.now() / 1000);
      // Tempo máximo em segundos
      const maxAgeSeconds = 60 * 60 * 48;
      if (currentTimestamp - parsedTimestamp <= maxAgeSeconds) {
        setCart(JSON.parse(storedCart));
      } else {
        localStorage.removeItem("cart");
        localStorage.removeItem("cartTimestamp");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("cartTimestamp", Math.floor(Date.now() / 1000).toString());
  }, [cart]);

  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, totalPrice, clearCart }}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextProps => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
