import { createContext, useContext, useEffect, useState } from "react";
import { getCart } from "../services/cartService";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const isLoggedIn = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return !!(user?.token);
    } catch {
      return false;
    }
  };

  const loadCartCount = async () => {
    if (!isLoggedIn()) {
      setCartCount(0);
      return;
    }

    try {
      const data = await getCart();
      const items = data?.cart?.items || [];
      const count = items.reduce(
        (total, item) => total + (item.quantity || 0),
        0
      );
      setCartCount(count);
    } catch (error) {
      // Silently fail — 401 just means user is not authenticated
      setCartCount(0);
    }
  };

  const resetCartCount = () => setCartCount(0);

  useEffect(() => {
    loadCartCount();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        loadCartCount,
        resetCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
