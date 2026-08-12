"use client";

import toast from "react-hot-toast";
import { getImageUrl } from "@/app/lib/getImageUrl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

import { useCart } from "../../context/CartContext";

export default function CartPage() {

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [loading, setLoading] =
    useState(false);
    const router = useRouter();
  const totalPrice = cartItems.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  // PLACE ORDER

  const handlePlaceOrder = async () => {

    if (cartItems.length === 0) {

      toast.error(
        "Your cart is empty"
      );

      return;

    }

    try {

      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/place-order",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({

            items: cartItems,

            total: totalPrice,

            email:
              localStorage.getItem(
                "userEmail"
              ),

          }),
        }
      );

      const data =
        await response.json();

      console.log(data);

      // SUCCESS

      if (data.success) {

        // SAVE ORDER

        localStorage.setItem(
          "latestOrder",
          JSON.stringify(data.order)
        );

        toast.success(
          "Order Placed Successfully 🚀"
        );

        clearCart();

        setTimeout(() => {

          window.location.href =
            "/track-order";

        }, 1500);

      } else {

        toast.error(
          data.message ||
          "Failed To Place Order"
        );

      }

    } catch (error) {

      console.log(error);

      toast.error(
        "Backend Server Error"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <>
      <Navbar/>

      <main className="min-h-screen bg-black text-white p-10">

        <div className="max-w-6xl mx-auto">

          {/* TITLE */}

          <h1 className="text-5xl font-bold text-orange-500">

            Your Cart

          </h1>

          {/* CART ITEMS */}

          <div className="mt-10 flex flex-col gap-6">

            {cartItems.length === 0 ? (

              <div className="bg-zinc-900 p-12 rounded-3xl text-center border border-zinc-800">

                <h2 className="text-4xl font-bold">

                  Your Cart Is Empty

                </h2>

                <p className="text-gray-400 mt-4 text-lg">

                  Add delicious food 🍔

                </p>

              </div>

            ) : (

              cartItems.map((item) => (

                <div
                  key={item.name}
                  className="bg-zinc-900 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 border border-zinc-800"
                >

                  {/* LEFT */}

                  <div className="flex items-center gap-5">

                    <img
                      src={getImageUrl(item.image)}
                      alt={item.name}
                      className="w-32 h-32 object-cover rounded-2xl"
                    />

                    <div>

                      <h2 className="text-3xl font-bold">

                        {item.name}

                      </h2>

                      <p className="text-orange-500 mt-3 text-2xl font-semibold">

                        ₹{item.price}

                      </p>

                    </div>

                  </div>

                  {/* RIGHT */}

                  <div className="flex flex-col md:flex-row items-center gap-5">

                    {/* QUANTITY */}

                    <div className="flex items-center gap-4">

                      <button
                        onClick={() =>
                          decreaseQuantity(item.name)
                        }
                        className="bg-zinc-800 w-12 h-12 rounded-2xl text-2xl hover:bg-zinc-700 transition-all"
                      >
                        -
                      </button>

                      <p className="text-2xl font-bold w-10 text-center">

                        {item.quantity}

                      </p>

                      <button
                        onClick={() =>
                          increaseQuantity(item.name)
                        }
                        className="bg-orange-500 w-12 h-12 rounded-2xl text-2xl hover:bg-orange-600 transition-all"
                      >
                        +
                      </button>

                    </div>

                    {/* REMOVE */}

                    <button
                      onClick={() =>
                        removeItem(item.name)
                      }
                      className="bg-red-500 px-6 py-3 rounded-2xl hover:bg-red-600 transition-all font-semibold"
                    >
                      Remove
                    </button>

                  </div>

                </div>

              ))

            )}

          </div>

          {/* TOTAL */}

          {cartItems.length > 0 && (

            <div className="mt-12 bg-zinc-900 p-8 rounded-3xl border border-zinc-800">

              <div className="flex justify-between items-center flex-wrap gap-4">

                <h2 className="text-4xl font-bold">

                  Total Amount

                </h2>

                <h2 className="text-5xl font-bold text-orange-500">

                  ₹{totalPrice}

                </h2>

              </div>

              {/* PLACE ORDER BUTTON */}

              <button
               onClick={() => router.push("/checkout")}
                disabled={loading}
                className="w-full bg-orange-500 py-5 rounded-3xl mt-8 hover:bg-orange-600 transition-all font-bold text-2xl disabled:opacity-50"
              >

                {loading
                  ? "Placing Order..."
                  : "Proceed To Checkout →"}

              </button>

            </div>

          )}

        </div>

      </main>

    </>

  );

}