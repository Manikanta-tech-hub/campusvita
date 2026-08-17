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

  const { cartItems, clearCart } = useCart();

  // =====================================
  // STATES
  // =====================================

  const [loading, setLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<"COD" | "ONLINE" | "WALLET">("COD");

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [location, setLocation] = useState("");

  // =====================================
  // TOTALS
  // =====================================

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + item.price * item.quantity,
      0
    );
  }, [cartItems]);

  const deliveryFee = 20;

  const totalAmount = subtotal + deliveryFee;

  // =====================================
  // VALIDATE CHECKOUT
  // =====================================

  const validateCheckout = () => {
    if (!name.trim()) {
      toast.error("Please enter your full name");
      return false;
    }

    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }

    if (!location.trim()) {
      toast.error("Please enter your pickup / hostel location");
      return false;
    }

    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return false;
    }

    return true;
  };

  // =====================================
  // ONLINE PAYMENT - RAZORPAY
  // =====================================

  const handleOnlinePayment = async () => {
    if (!validateCheckout()) {
      return;
    }

    try {
      setLoading(true);

      const token =
        localStorage.getItem("access_token");

      if (!token) {
        toast.error("Please login again");
        router.push("/login");
        return;
      }

      // =====================================
      // 1. CREATE RAZORPAY ORDER
      // =====================================

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

      const orderData =
        await orderResponse.json();

      console.log(
        "Razorpay order response:",
        orderData
      );

      if (!orderResponse.ok) {
        toast.error(
          orderData.detail ||
            orderData.message ||
            "Failed to create payment order"
        );

        return;
      }

      if (!orderData.success) {
        toast.error(
          orderData.message ||
            "Failed to create payment"
        );

        return;
      }

      const orderIntent =
        orderData.order_intent;

      // =====================================
      // CHECK RAZORPAY SCRIPT
      // =====================================

      if (!window.Razorpay) {
        toast.error(
          "Razorpay is still loading. Please try again."
        );

        return;
      }

      // =====================================
      // 2. RAZORPAY OPTIONS
      // =====================================

      const options = {
        key: orderData.key,

        amount: orderData.amount,

        currency: orderData.currency,

        name: "CampusVita",

        description: "Food Order Payment",

        order_id: orderData.order_id,

        handler: async function (
          response: any
        ) {
          console.log(
            "Razorpay Payment Response:",
            response
          );

          await handleVerifyPayment(
            response,
            orderIntent
          );
        },

        prefill: {
          name: name,

          contact: phone,

          email:
            localStorage.getItem(
              "userEmail"
            ) ||
            localStorage.getItem(
              "email"
            ) ||
            "",
        },

        theme: {
          color: "#f97316",
        },

        modal: {
          ondismiss: function () {
            console.log(
              "Razorpay checkout closed"
            );
            setLoading(false);
          },
        },
      };

      console.log(
        "Razorpay Options:",
        options
      );

      // =====================================
      // 3. OPEN RAZORPAY
      // =====================================

      const razor =
        new window.Razorpay(options);

      razor.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Razorpay Payment Failed:",
            response?.error
          );

          toast.error(
            response?.error?.description ||
              "Payment failed"
          );

          setLoading(false);
        }
      );

      razor.open();

    } catch (error) {
      console.error(
        "Online payment error:",
        error
      );

      toast.error(
        "Payment initialization failed"
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // VERIFY ONLINE PAYMENT
  // =====================================

  const handleVerifyPayment = async (
    paymentResponse: any,
    orderIntent: string
  ) => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        toast.error(
          "Please login again"
        );

        router.push("/login");

        return;
      }

      const verifyResponse =
        await fetch(
          "http://127.0.0.1:8000/verify-payment",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              razorpay_payment_id:
                paymentResponse.razorpay_payment_id,

              razorpay_order_id:
                paymentResponse.razorpay_order_id,

              razorpay_signature:
                paymentResponse.razorpay_signature,

              order_intent:
                orderIntent,
            }),
          }
        );

      const data =
        await verifyResponse.json();

      console.log(
        "Verify payment response:",
        data
      );

      if (!verifyResponse.ok) {
        toast.error(
          data.detail ||
            data.message ||
            "Payment verification failed"
        );

        return;
      }

      if (data.success) {
        // =====================================
        // SAVE LATEST ORDER
        // =====================================

        localStorage.setItem(
          "latestOrder",
          JSON.stringify(data.order)
        );

        // =====================================
        // SAVE LATEST PAYMENT
        // =====================================

        localStorage.setItem(
          "latestPayment",
          JSON.stringify({
            paymentId:
              paymentResponse.razorpay_payment_id,

            orderId:
              paymentResponse.razorpay_order_id,

            amount: totalAmount,

            date:
              new Date().toLocaleString(),

            method: "Online",
          })
        );

        toast.success(
          "Payment Successful 🚀"
        );

        // =====================================
        // CLEAR CART
        // =====================================

        clearCart();

        // =====================================
        // REDIRECT
        // =====================================

        setTimeout(() => {
          router.push(
            "/payment-success"
          );
        }, 1200);

      } else {
        toast.error(
          data.detail ||
            data.message ||
            "Payment verification failed"
        );
      }

    } catch (error) {
      console.error(
        "Payment verification error:",
        error
      );

      toast.error(
        "Server Error during verification"
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // WALLET PAYMENT
  // =====================================

  const handleWalletPayment =
    async () => {
      if (!validateCheckout()) {
        return;
      }

      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          toast.error(
            "Please login again"
          );

          router.push("/login");

          return;
        }

        // =====================================
        // WALLET PAYMENT REQUEST
        // =====================================

        const response =
          await fetch(
            "http://127.0.0.1:8000/wallet/pay-order",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                items: cartItems,

                name: name,

                phone: phone,

                location: location,
              }),
            }
          );

        const data =
          await response.json();

        console.log(
          "Wallet payment response:",
          data
        );

        // =====================================
        // SERVER ERROR
        // =====================================

        if (!response.ok) {
          toast.error(
            data.detail ||
              data.message ||
              "Wallet payment failed"
          );

          return;
        }

        // =====================================
        // SUCCESS
        // =====================================

        if (data.success) {
          // Save latest order
          localStorage.setItem(
            "latestOrder",
            JSON.stringify(
              data.order
            )
          );

          // Save latest payment
          localStorage.setItem(
            "latestPayment",
            JSON.stringify({
              paymentId:
                data.payment_id ||
                null,

              orderId:
                data.order?._id ||
                data.order?.order_id ||
                null,

              amount:
                data.amount_paid ||
                totalAmount,

              date:
                new Date().toLocaleString(),

              method: "WALLET",
            })
          );

          toast.success(
            "Order placed using wallet 🚀"
          );

          // Clear cart
          clearCart();

          // Redirect
          setTimeout(() => {
            router.push(
              "/track-order"
            );
          }, 1000);

        } else {
          toast.error(
            data.detail ||
              data.message ||
              "Wallet payment failed"
          );
        }

      } catch (error) {
        console.error(
          "Wallet payment error:",
          error
        );

        toast.error(
          "Server error during wallet payment"
        );

      } finally {
        setLoading(false);
      }
    };

  // =====================================
  // COD PLACE ORDER
  // =====================================

  const handlePlaceOrder =
    async () => {
      if (!validateCheckout()) {
        return;
      }

      try {
        setLoading(true);

        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          toast.error(
            "Please login again"
          );

          router.push("/login");

          return;
        }

        const response =
          await fetch(
            "http://127.0.0.1:8000/place-order",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                items: cartItems,

                total: totalAmount,

                email:
                  localStorage.getItem(
                    "userEmail"
                  ) ||
                  localStorage.getItem(
                    "email"
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

        console.log(
          "COD order response:",
          data
        );

        if (!response.ok) {
          toast.error(
            data.detail ||
              data.message ||
              "Failed to place order"
          );

          return;
        }

        if (data.success) {
          localStorage.setItem(
            "latestOrder",
            JSON.stringify(
              data.order
            )
          );

          toast.success(
            "Order Placed Successfully 🚀"
          );

          clearCart();

          setTimeout(() => {
            router.push(
              "/track-order"
            );
          }, 1200);

        } else {
          toast.error(
            data.detail ||
              data.message ||
              "Failed to place order"
          );
        }

      } catch (error) {
        console.error(
          "COD order error:",
          error
        );

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
      {/* =====================================
          RAZORPAY SCRIPT
      ===================================== */}

      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      {/* =====================================
          NAVBAR
      ===================================== */}

      <Navbar />

      {/* =====================================
          MAIN
      ===================================== */}

      <main className="min-h-screen bg-black text-white p-6 md:p-10">

        <div className="max-w-7xl mx-auto">

          {/* =====================================
              HEADER
          ===================================== */}

          <div>
            <h1 className="text-5xl font-bold text-orange-500">
              Checkout
            </h1>

            <p className="text-gray-400 mt-3 text-lg">
              Complete your order 🚀
            </p>
          </div>

          {/* =====================================
              MAIN GRID
          ===================================== */}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-12">

            {/* =====================================
                LEFT SECTION
            ===================================== */}

            <div className="xl:col-span-2 flex flex-col gap-8">

              {/* =====================================
                  DELIVERY DETAILS
              ===================================== */}

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

                <h2 className="text-3xl font-bold">
                  Delivery Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

                  {/* NAME */}

                  <div className="bg-zinc-800 rounded-2xl p-5 flex items-center gap-4">

                    <User
                      size={24}
                      className="text-gray-300"
                    />

                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) =>
                        setName(
                          e.target.value
                        )
                      }
                      className="bg-transparent outline-none w-full text-white placeholder-gray-400"
                    />

                  </div>

                  {/* PHONE */}

                  <div className="bg-zinc-800 rounded-2xl p-5 flex items-center gap-4">

                    <Phone
                      size={24}
                      className="text-gray-300"
                    />

                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) =>
                        setPhone(
                          e.target.value
                        )
                      }
                      className="bg-transparent outline-none w-full text-white placeholder-gray-400"
                    />

                  </div>

                </div>

                {/* LOCATION */}

                <div className="bg-zinc-800 rounded-2xl p-5 flex items-center gap-4 mt-6">

                  <MapPin
                    size={24}
                    className="text-gray-300"
                  />

                  <input
                    type="text"
                    placeholder="Pickup / Hostel Location"
                    value={location}
                    onChange={(e) =>
                      setLocation(
                        e.target.value
                      )
                    }
                    className="bg-transparent outline-none w-full text-white placeholder-gray-400"
                  />

                </div>

              </div>

              {/* =====================================
                  PAYMENT METHOD
              ===================================== */}

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">

                <h2 className="text-3xl font-bold">
                  Payment Method
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">

                  {/* =====================================
                      COD
                  ===================================== */}

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod(
                        "COD"
                      )
                    }
                    className={`p-6 rounded-3xl border transition-all text-left ${
                      paymentMethod === "COD"
                        ? "border-orange-500 bg-orange-500/20 shadow-lg shadow-orange-500/10"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                    }`}
                  >

                    <Wallet
                      size={40}
                      className={
                        paymentMethod ===
                        "COD"
                          ? "text-orange-500"
                          : "text-white"
                      }
                    />

                    <h3 className="text-2xl font-bold mt-4">
                      Cash On Delivery
                    </h3>

                    <p className="text-gray-400 mt-2">
                      Pay when you collect your order
                    </p>

                  </button>

                  {/* =====================================
                      ONLINE PAYMENT
                  ===================================== */}

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod(
                        "ONLINE"
                      )
                    }
                    className={`p-6 rounded-3xl border transition-all text-left ${
                      paymentMethod === "ONLINE"
                        ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/10"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                    }`}
                  >

                    <CreditCard
                      size={40}
                      className={
                        paymentMethod ===
                        "ONLINE"
                          ? "text-green-500"
                          : "text-white"
                      }
                    />

                    <h3 className="text-2xl font-bold mt-4">
                      Online Payment
                    </h3>

                    <p className="text-gray-400 mt-2">
                      Pay securely using Razorpay
                    </p>

                  </button>

                  {/* =====================================
                      CAMPUSVITA WALLET
                  ===================================== */}

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod(
                        "WALLET"
                      )
                    }
                    className={`p-6 rounded-3xl border transition-all text-left ${
                      paymentMethod === "WALLET"
                        ? "border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/10"
                        : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                    }`}
                  >

                    <Wallet
                      size={40}
                      className={
                        paymentMethod ===
                        "WALLET"
                          ? "text-purple-400"
                          : "text-white"
                      }
                    />

                    <h3 className="text-2xl font-bold mt-4">
                      CampusVita Wallet
                    </h3>

                    <p className="text-gray-400 mt-2">
                      Pay using your wallet balance
                    </p>

                  </button>

                </div>

              </div>

            </div>

            {/* =====================================
                RIGHT - ORDER SUMMARY
            ===================================== */}

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 h-fit sticky top-10">

              <h2 className="text-3xl font-bold">
                Order Summary
              </h2>

              {/* =====================================
                  CART ITEMS
              ===================================== */}

              <div className="mt-8 flex flex-col gap-5">

                {cartItems.length === 0 ? (
                  <p className="text-gray-400">
                    Your cart is empty.
                  </p>
                ) : (
                  cartItems.map(
                    (item) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-center gap-4"
                      >

                        <div>
                          <h3 className="font-bold text-lg">
                            {item.name}
                          </h3>

                          <p className="text-gray-400">
                            Qty:{" "}
                            {item.quantity}
                          </p>
                        </div>

                        <h3 className="font-bold text-orange-500 whitespace-nowrap">
                          ₹
                          {(
                            item.price *
                            item.quantity
                          ).toFixed(2)}
                        </h3>

                      </div>
                    )
                  )
                )}

              </div>

              {/* =====================================
                  BILL
              ===================================== */}

              <div className="border-t border-zinc-700 mt-8 pt-8 flex flex-col gap-4">

                {/* SUBTOTAL */}

                <div className="flex justify-between">

                  <p className="text-gray-400">
                    Subtotal
                  </p>

                  <p>
                    ₹{subtotal.toFixed(2)}
                  </p>

                </div>

                {/* DELIVERY FEE */}

                <div className="flex justify-between">

                  <p className="text-gray-400">
                    Delivery Fee
                  </p>

                  <p>
                    ₹{deliveryFee.toFixed(2)}
                  </p>

                </div>

                {/* TOTAL */}

                <div className="flex justify-between text-2xl font-bold mt-4">

                  <p>
                    Total
                  </p>

                  <p className="text-orange-500">
                    ₹{totalAmount.toFixed(2)}
                  </p>

                </div>

              </div>

              {/* =====================================
                  PAYMENT METHOD INDICATOR
              ===================================== */}

              <div className="mt-6">

                <p className="text-sm text-gray-400">
                  Selected Payment Method
                </p>

                <div className="mt-2 bg-zinc-800 rounded-xl px-4 py-3">

                  <p className="font-semibold">

                    {paymentMethod ===
                    "COD"
                      ? "💵 Cash On Delivery"
                      : paymentMethod ===
                        "ONLINE"
                      ? "💳 Online Payment"
                      : "💰 CampusVita Wallet"}

                  </p>

                </div>

              </div>

              {/* =====================================
                  MAIN PAYMENT BUTTON
              ===================================== */}

              <button
                type="button"
                onClick={() => {
                  if (loading) {
                    return;
                  }

                  if (
                    paymentMethod ===
                    "ONLINE"
                  ) {
                    handleOnlinePayment();

                  } else if (
                    paymentMethod ===
                    "WALLET"
                  ) {
                    handleWalletPayment();

                  } else {
                    handlePlaceOrder();
                  }
                }}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 transition-all py-5 rounded-3xl mt-8 font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >

                {loading
                  ? "Processing..."
                  : paymentMethod ===
                    "ONLINE"
                  ? "Pay Online 💳"
                  : paymentMethod ===
                    "WALLET"
                  ? "Pay From Wallet 💰"
                  : "Confirm Order 🚀"}

              </button>

            </div>

          </div>

        </div>

      </main>
    </>
  );
}