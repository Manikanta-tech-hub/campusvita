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
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];

  addToCart: (
    item: Omit<CartItem, "quantity">
  ) => void;

  increaseQuantity: (
    name: string
  ) => void;

  decreaseQuantity: (
    name: string
  ) => void;

  removeItem: (
    name: string
  ) => void;

  clearCart: () => void;
};

const CartContext =
  createContext<CartContextType | null>(
    null
  );

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
          cartItem.name === item.name
      );

    if (existingItem) {

      increaseQuantity(item.name);

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
    name: string
  ) => {

    setCartItems(
      cartItems.map((item) =>
        item.name === name
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
    name: string
  ) => {

    setCartItems(
      cartItems
        .map((item) =>
          item.name === name
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
    name: string
  ) => {

    setCartItems(
      cartItems.filter(
        (item) =>
          item.name !== name
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