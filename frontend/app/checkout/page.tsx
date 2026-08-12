"use client";

import toast from "react-hot-toast";
import Script from "next/script";
import { useRouter } from "next/navigation";

import { useMemo, useState } from "react";

import {
  CreditCard,
  Wallet,
  MapPin,
  User,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";

import { useCart } from "../../context/CartContext";

// =====================================
// TYPESCRIPT DECLARATION
// =====================================

declare global {
  interface Window {
    Razorpay: any;
  }
}

// =====================================
// COMPONENT
// =====================================

export default function CheckoutPage() {

  const router = useRouter();

  const { cartItems, clearCart } =
    useCart();

  // =====================================
  // STATES
  // =====================================

  const [loading, setLoading] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState("COD");

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [location, setLocation] =
    useState("");

  // =====================================
  // TOTALS
  // =====================================

  const subtotal = useMemo(() => {

    return cartItems.reduce(
      (total, item) =>
        total +
        item.price * item.quantity,
      0
    );

  }, [cartItems]);

  const deliveryFee = 20;

  const totalAmount =
    subtotal + deliveryFee;

  // =====================================
  // ONLINE PAYMENT (RAZORPAY)
  // =====================================

  const handleOnlinePayment = async () => {

    // Check if user details are filled
    if (!name || !phone || !location) {
      toast.error("Please fill all delivery details first");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    try {
      setLoading(true);

      // 1. Create Razorpay Order on Backend
      const token = localStorage.getItem("access_token");
      const orderResponse = await fetch(
        "http://127.0.0.1:8000/create-razorpay-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: cartItems,
            name: name,
            phone: phone,
            location: location,
        }),
        }
      );

      const orderData = await orderResponse.json();
      console.log(orderData);
      const orderIntent = orderData.order_intent;
      if (!orderData.success) {
        toast.error(orderData.message || "Failed to create payment");
        setLoading(false);
        return;
      }

      // 2. Initialize Razorpay Checkout
      const options = {
        key:  orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "CampusVita",
        description: "Food Order Payment",
        order_id: orderData.order_id, // ✅ Pass the order_id from backend
        handler: async function (response: any) {
          // ✅ This runs after successful payment
          console.log("Payment Response:", response);
           // 3. Verify payment and place order
          await handleVerifyPayment(response, orderIntent);
        },
        prefill: {
          name: name,
          contact: phone,
          email: localStorage.getItem("userEmail") || "",
        },
        theme: {
          color: "#f97316",
        },
      };
      console.log("Order Data:", orderData);
console.log("Options:", options);
      const razor = new window.Razorpay(options);

razor.on("payment.failed", function (response: any) {
  console.log("Payment Failed:");
  console.log(response.error);

  alert(JSON.stringify(response.error, null, 2));
});

razor.open();
    } catch (error) {
      console.log(error);
      toast.error("Payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // VERIFY PAYMENT & PLACE ORDER
  // =====================================

  const handleVerifyPayment = async (paymentResponse: any,orderIntent: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      const verifyResponse = await fetch(
        "http://127.0.0.1:8000/verify-payment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            order_intent: orderIntent,
            // Also send order details to place the order
            items: cartItems,
            total: totalAmount,
            email: localStorage.getItem("userEmail"),
            name: name,
            phone: phone,
            location: location,
          }),
        }
      );

      const data = await verifyResponse.json();

      if (data.success) {

        localStorage.setItem(
          "latestOrder",
          JSON.stringify(data.order)
        );
      
        localStorage.setItem(
          "latestPayment",
          JSON.stringify({
            paymentId: paymentResponse.razorpay_payment_id,
            orderId: paymentResponse.razorpay_order_id,
            amount: totalAmount,
            date: new Date().toLocaleString(),
            method: "Online",
          })
        );
      
        toast.success("Payment Successful 🚀");
      
        clearCart();
      
        setTimeout(() => {
          router.push("/payment-success");
        }, 1500);
      
      } else {
        toast.error(data.message || "Payment verification failed");
      }

    } catch (error) {
      console.log(error);
      toast.error("Server Error during verification");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // COD PLACE ORDER
  // =====================================

  const handlePlaceOrder =
    async () => {

      if (
        !name ||
        !phone ||
        !location
      ) {

        toast.error(
          "Fill all details"
        );

        return;

      }

      if (cartItems.length === 0) {

        toast.error(
          "Cart is empty"
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

              total: totalAmount,

              email:
                localStorage.getItem(
                  "userEmail"
                ),
                
              name: name,
              phone: phone,
              location: location,
              paymentMethod: "COD",
            }),
          }
        );

        const data =
          await response.json();

        if (data.success) {

          localStorage.setItem(
            "latestOrder",
            JSON.stringify(data.order)
          );

          toast.success(
            "Order Placed Successfully 🚀"
          );

          clearCart();

          setTimeout(() => {

            router.push(
              "/track-order"
            );

          }, 1500);

        } else {

          toast.error(
            data.detail ||
            data.message ||
            "Signup failed"
          );
        
        }

      } catch (error) {

        console.log(error);

        toast.error(
          "Server Error"
        );

      } finally {

        setLoading(false);

      }

    };

  // =====================================
  // MAIN UI
  // =====================================

  return (

    <>
      {/* ✅ RAZORPAY SCRIPT */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <Navbar/>

      <main className="min-h-screen bg-black text-white p-6 md:p-10">

        <div className="max-w-7xl mx-auto">

          {/* HEADER */}

          <div>

            <h1 className="text-5xl font-bold text-orange-500">

              Checkout

            </h1>

            <p className="text-gray-400 mt-3 text-lg">

              Complete your order 🚀

            </p>

          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-12">

            {/* LEFT */}

            <div className="xl:col-span-2 flex flex-col gap-8">

              {/* USER DETAILS */}

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

                <h2 className="text-3xl font-bold">

                  Delivery Details

                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                  {/* NAME */}

                  <div className="bg-zinc-800 rounded-2xl p-5 flex items-center gap-4">

                    <User />

                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      className="bg-transparent outline-none w-full"
                    />

                  </div>

                  {/* PHONE */}

                  <div className="bg-zinc-800 rounded-2xl p-5 flex items-center gap-4">

                    <Phone />

                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                        )
                      }
                      className="bg-transparent outline-none w-full"
                    />

                  </div>

                </div>

                {/* LOCATION */}

                <div className="bg-zinc-800 rounded-2xl p-5 flex items-center gap-4 mt-6">

                  <MapPin />

                  <input
                    type="text"
                    placeholder="Pickup / Hostel Location"
                    value={location}
                    onChange={(e) =>
                      setLocation(
                        e.target.value
                      )
                    }
                    className="bg-transparent outline-none w-full"
                  />

                </div>

              </div>

              {/* PAYMENT */}

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

                <h2 className="text-3xl font-bold">

                  Payment Method

                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

                  {/* COD */}

                  <button
                    onClick={() =>
                      setPaymentMethod(
                        "COD"
                      )
                    }
                    className={`p-6 rounded-3xl border transition-all ${
                      paymentMethod ===
                      "COD"
                        ? "border-orange-500 bg-orange-500/20"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >

                    <Wallet size={40} />

                    <h3 className="text-2xl font-bold mt-4">

                      Cash On Delivery

                    </h3>

                  </button>

                  {/* ONLINE */}

                  <button
                    onClick={() =>
                      setPaymentMethod(
                        "ONLINE"
                      )
                    }
                    className={`p-6 rounded-3xl border transition-all ${
                      paymentMethod ===
                      "ONLINE"
                        ? "border-green-500 bg-green-500/20"
                        : "border-zinc-700 bg-zinc-800"
                    }`}
                  >

                    <CreditCard size={40} />

                    <h3 className="text-2xl font-bold mt-4">

                      Online Payment

                    </h3>

                  </button>

                </div>

              </div>

            </div>

            {/* RIGHT */}

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-fit sticky top-10">

              <h2 className="text-3xl font-bold">

                Order Summary

              </h2>

              <div className="mt-8 flex flex-col gap-5">

                {cartItems.map(
                  (item) => (

                    <div
                      key={item.name}
                      className="flex justify-between items-center"
                    >

                      <div>

                        <h3 className="font-bold text-lg">

                          {item.name}

                        </h3>

                        <p className="text-gray-400">

                          Qty:
                          {" "}
                          {item.quantity}

                        </p>

                      </div>

                      <h3 className="font-bold text-orange-500">

                        ₹
                        {item.price *
                          item.quantity}

                      </h3>

                    </div>

                  )
                )}

              </div>

              {/* BILL */}

              <div className="border-t border-zinc-700 mt-8 pt-8 flex flex-col gap-4">

                <div className="flex justify-between">

                  <p className="text-gray-400">

                    Subtotal

                  </p>

                  <p>

                    ₹{subtotal}

                  </p>

                </div>

                <div className="flex justify-between">

                  <p className="text-gray-400">

                    Delivery Fee

                  </p>

                  <p>

                    ₹{deliveryFee}

                  </p>

                </div>

                <div className="flex justify-between text-2xl font-bold mt-4">

                  <p>Total</p>

                  <p className="text-orange-500">

                    ₹{totalAmount}

                  </p>

                </div>

              </div>

              {/* ✅ UPDATED BUTTON */}
              <button
                onClick={() => {
                  if (paymentMethod === "ONLINE") {
                    handleOnlinePayment();
                  } else {
                    handlePlaceOrder();
                  }
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 transition-all py-5 rounded-3xl mt-8 font-bold text-xl disabled:opacity-50"
              >

                {loading
                  ? "Processing..."
                  : paymentMethod === "ONLINE" 
                  ? "Pay Online 💳" 
                  : "Confirm Order 🚀"}

              </button>

            </div>

          </div>

        </div>

      </main>

    </>

  );

}