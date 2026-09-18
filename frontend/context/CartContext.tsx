"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";

type CartItem = {
  name: string;
  price: number;
  image: string;
  stall_id: string;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];

  addToCart: (
    item: Omit<CartItem, "quantity">
  ) => void;

  increaseQuantity: (
    name: string,
    stall_id: string
  ) => void;

  decreaseQuantity: (
    name: string,
    stall_id: string
  ) => void;

  removeItem: (
    name: string,
    stall_id: string
  ) => void;

  clearCart: () => void;
};

const CartContext =
  createContext<CartContextType | null>(null);

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cartItems, setCartItems] =
    useState<CartItem[]>([]);

  const addToCart = (
    item: Omit<CartItem, "quantity">
  ) => {
    const existingItem =
      cartItems.find(
        (cartItem) =>
          cartItem.name === item.name &&
          cartItem.stall_id === item.stall_id
      );

    if (existingItem) {
      increaseQuantity(
        item.name,
        item.stall_id
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          ...item,
          quantity: 1,
        },
      ]);
    }
  };

  const increaseQuantity = (
    name: string,
    stall_id: string
  ) => {
    setCartItems(
      cartItems.map((item) =>
        item.name === name &&
        item.stall_id === stall_id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  };

  const decreaseQuantity = (
    name: string,
    stall_id: string
  ) => {
    setCartItems(
      cartItems
        .map((item) =>
          item.name === name &&
          item.stall_id === stall_id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  };

  const removeItem = (
    name: string,
    stall_id: string
  ) => {
    setCartItems(
      cartItems.filter(
        (item) =>
          !(
            item.name === name &&
            item.stall_id === stall_id
          )
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}