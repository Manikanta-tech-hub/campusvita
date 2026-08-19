"use client";

import Script from "next/script";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
} from "lucide-react";
import { useEffect, useState } from "react";

import Navbar from "@/components/layout/Navbar";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type WalletHistory = {
  type: string;
  amount: number;
  reason: string;
  date: string;
  payment_id?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function WalletPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState<WalletHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const getToken = () => {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token")
    );
  };

  const getAuthHeaders = () => {
    const token = getToken();

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // =====================================
  // LOAD WALLET
  // =====================================

  const fetchWallet = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/wallet/balance`,
        {
          headers: getAuthHeaders(),
        }
      );

      setWalletBalance(
        Number(response.data.balance || 0)
      );

      setHistory(
        response.data.history || []
      );
    } catch (error: any) {
      console.error(
        "Wallet fetch error:",
        error
      );

      if (error?.response?.status === 401) {
        toast.error(
          "Session expired. Please login again."
        );
      } else {
        toast.error(
          "Failed to load wallet"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // =====================================
  // ADD MONEY
  // =====================================

  const handleAddMoney = async () => {
    const numericAmount = Number(amount);

    if (!amount) {
      toast.error("Enter amount");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      toast.error(
        "Enter a valid amount"
      );
      return;
    }

    try {
      setProcessing(true);

      // =====================================
      // 1. CREATE RAZORPAY ORDER
      // =====================================

      const response = await axios.post(
        `${API_URL}/wallet/create-topup-order`,
        {
          amount: numericAmount,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      const orderData = response.data;

      if (!orderData.success) {
        toast.error(
          orderData.message ||
            "Failed to create wallet payment"
        );

        return;
      }

      // =====================================
      // 2. RAZORPAY CHECKOUT
      // =====================================

      if (!window.Razorpay) {
        toast.error(
          "Razorpay is still loading. Please try again."
        );
        return;
      }

      const options = {
        key: orderData.key,

        amount: orderData.amount,

        currency: orderData.currency,

        name: "CampusVita",

        description:
          "CampusVita Wallet Top-up",

        order_id: orderData.order_id,

        handler: async function (
          paymentResponse: any
        ) {
          await verifyWalletTopup(
            paymentResponse,
            orderData.order_intent
          );
        },

        theme: {
          color: "#f97316",
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Wallet payment failed:",
            response.error
          );

          toast.error(
            "Wallet payment failed"
          );

          setProcessing(false);
        }
      );

      razorpay.open();
    } catch (error: any) {
      console.error(
        "Create wallet payment error:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Failed to initialize payment"
      );

      setProcessing(false);
    }
  };

  // =====================================
  // VERIFY WALLET TOPUP
  // =====================================

  const verifyWalletTopup = async (
    paymentResponse: any,
    orderIntent: string
  ) => {
    try {
      const response = await axios.post(
        `${API_URL}/wallet/verify-topup`,
        {
          razorpay_payment_id:
            paymentResponse.razorpay_payment_id,

          razorpay_order_id:
            paymentResponse.razorpay_order_id,

          razorpay_signature:
            paymentResponse.razorpay_signature,

          order_intent: orderIntent,
        },
        {
          headers: getAuthHeaders(),
        }
      );

      const data = response.data;

      if (data.success) {
        toast.success(
          `₹${data.amount_added} added to wallet 🚀`
        );

        setAmount("");

        // Reload actual MongoDB wallet
        await fetchWallet();
      } else {
        toast.error(
          data.message ||
            "Wallet verification failed"
        );
      }
    } catch (error: any) {
      console.error(
        "Wallet verification error:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          "Wallet payment verification failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  // =====================================
  // LOADING
  // =====================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading Wallet...
      </main>
    );
  }

  // =====================================
  // UI
  // =====================================

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <Navbar />

      <main className="min-h-screen bg-black text-white p-6 md:p-10">
        <div className="max-w-6xl mx-auto">

          <h1 className="text-5xl font-bold text-orange-500">
            My Wallet
          </h1>

          {/* WALLET CARD */}

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-10 mt-10">

            <div className="flex items-center gap-4">

              <Wallet size={45} />

              <div>

                <p className="text-xl">
                  Wallet Balance
                </p>

                <h2 className="text-5xl font-bold mt-2">
                  ₹{walletBalance.toFixed(2)}
                </h2>

              </div>

            </div>

          </div>

          {/* ADD MONEY */}

          <div className="bg-zinc-900 rounded-3xl p-8 mt-10 border border-zinc-800">

            <h2 className="text-3xl font-bold">
              Add Money
            </h2>

            <div className="flex flex-col md:flex-row gap-4 mt-6">

              <input
                type="number"
                min="1"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                className="flex-1 bg-zinc-800 p-4 rounded-2xl outline-none border border-zinc-700 focus:border-orange-500"
              />

              <button
                onClick={handleAddMoney}
                disabled={processing}
                className="bg-orange-500 hover:bg-orange-600 transition-all px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Plus />

                {processing
                  ? "Processing..."
                  : "Add Money"}
              </button>

            </div>

          </div>

          {/* HISTORY */}

          <div className="bg-zinc-900 rounded-3xl p-8 mt-10 border border-zinc-800">

            <h2 className="text-3xl font-bold">
              Wallet History
            </h2>

            <div className="flex flex-col gap-5 mt-8">

              {history.length === 0 ? (

                <p className="text-gray-400">
                  No Transactions Yet
                </p>

              ) : (

                history.map(
                  (item, index) => {

                    const isCredit =
                      item.type ===
                        "credit" ||
                      item.type ===
                        "refund";

                    return (
                      <div
                        key={
                          item.payment_id ||
                          index
                        }
                        className="bg-zinc-800 p-5 rounded-2xl flex justify-between items-center gap-4"
                      >

                        <div className="flex items-center gap-4">

                          {item.type ===
                          "credit" ? (

                            <ArrowDownLeft className="text-green-400" />

                          ) : item.type ===
                            "refund" ? (

                            <Gift className="text-blue-400" />

                          ) : (

                            <ArrowUpRight className="text-red-400" />

                          )}

                          <div>

                            <h3 className="font-bold text-lg">
                              {item.reason}
                            </h3>

                            <p className="text-gray-400 text-sm">
                              {item.date}
                            </p>

                          </div>

                        </div>

                        <h2
                          className={`text-xl md:text-2xl font-bold ${
                            isCredit
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {isCredit
                            ? "+"
                            : "-"}
                          ₹
                          {Number(
                            item.amount
                          ).toFixed(2)}
                        </h2>

                      </div>
                    );
                  }
                )

              )}

            </div>

          </div>

        </div>
      </main>
    </>
  );
}