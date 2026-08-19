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
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  order_token?: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function WalletPage() {
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState<WalletHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

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

  // ============================================================
  // LOAD REAL WALLET DATA
  // ============================================================

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
        Array.isArray(response.data.history)
          ? response.data.history
          : []
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

  // ============================================================
  // ADD MONEY
  // ============================================================

  const handleAddMoney = async () => {
    const numericAmount = Number(amount);

    if (!amount.trim()) {
      toast.error("Enter amount");
      return;
    }

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      toast.error("Enter a valid amount");
      return;
    }

    try {
      setProcessing(true);

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

        setProcessing(false);
        return;
      }

      if (!razorpayLoaded || !window.Razorpay) {
        toast.error(
          "Razorpay is still loading. Please wait a moment."
        );
        setProcessing(false);
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

  // ============================================================
  // VERIFY TOP-UP
  // ============================================================

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

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black text-white px-4 pt-6 pb-24 md:px-6">
          <div className="mx-auto w-full max-w-md">

            <div className="h-7 w-32 animate-pulse rounded-lg bg-zinc-800" />

            <div className="mt-5 h-32 animate-pulse rounded-3xl bg-zinc-900" />

            <div className="mt-5 h-40 animate-pulse rounded-3xl bg-zinc-900" />

            <div className="mt-5 h-48 animate-pulse rounded-3xl bg-zinc-900" />

          </div>
        </main>
      </>
    );
  }

  // ============================================================
  // REAL TRANSACTIONS
  // ============================================================

  const recentTransactions = history.slice(0, 4);

  return (
    <>
      <Script
  src="https://checkout.razorpay.com/v1/checkout.js"
  strategy="afterInteractive"
  onLoad={() => {
    console.log("✅ Razorpay SDK loaded");
    setRazorpayLoaded(true);
  }}
  onError={() => {
    console.error("❌ Razorpay SDK failed to load");
    setRazorpayLoaded(false);
    toast.error("Unable to load Razorpay");
  }}
/>

      <Navbar />

      <main className="min-h-screen bg-black text-white px-4 pt-5 pb-24 md:px-6 md:pt-8">

        <div className="mx-auto w-full max-w-md">

          {/* ====================================================
              HEADER
              ==================================================== */}

          <div className="mb-5">

            <h1 className="text-2xl font-bold tracking-tight">
              My Wallet
            </h1>

            <p className="mt-1 text-sm text-zinc-400">
              Manage your CampusVita balance
            </p>

          </div>

          {/* ====================================================
              BALANCE CARD
              ==================================================== */}

          <section className="relative overflow-hidden rounded-3xl border border-orange-400/20 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-5 shadow-xl shadow-orange-950/30">

            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                    <Wallet
                      size={19}
                      strokeWidth={2.3}
                    />
                  </div>

                  <span className="text-sm font-medium text-orange-50">
                    Wallet Balance
                  </span>

                </div>

              </div>

              <div className="mt-4">

                <p className="text-3xl font-bold tracking-tight">
                  ₹{walletBalance.toFixed(2)}
                </p>

                <p className="mt-1 text-xs text-orange-100">
                  Available balance
                </p>

              </div>

            </div>

          </section>

          {/* ====================================================
              ADD MONEY
              ==================================================== */}

          <section className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-4">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold">
                  Add Money
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Add funds securely using Razorpay
                </p>

              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                <Plus size={19} />
              </div>

            </div>

            {/* Amount */}

            <div className="mt-4">

              <div className="flex items-center rounded-2xl border border-zinc-700 bg-zinc-800 px-4 transition focus-within:border-orange-500">

                <span className="mr-2 text-lg font-semibold text-zinc-400">
                  ₹
                </span>

                <input
                  type="number"
                  min="1"
                  inputMode="decimal"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  className="h-12 w-full bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
                />

              </div>

            </div>

            {/* Quick amounts */}

            <div className="mt-3 grid grid-cols-4 gap-2">

              {[100, 500, 1000, 2000].map(
                (quickAmount) => (
                  <button
                    key={quickAmount}
                    type="button"
                    onClick={() =>
                      setAmount(
                        String(quickAmount)
                      )
                    }
                    disabled={processing}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition active:scale-95 ${
                      Number(amount) ===
                      quickAmount
                        ? "border-orange-500 bg-orange-500/15 text-orange-400"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-orange-500/60 hover:text-orange-400"
                    }`}
                  >
                    + ₹{quickAmount}
                  </button>
                )
              )}

            </div>

            {/* Add button */}

            <button
              type="button"
              onClick={handleAddMoney}
              disabled={processing}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl bg-orange-500 text-sm font-bold text-white shadow-lg shadow-orange-950/20 transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Processing..."
                : "Add Money"}
            </button>

          </section>

          {/* ====================================================
              RECENT TRANSACTIONS
              ==================================================== */}

          <section className="mt-5">

            <div className="mb-3 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold">
                  Recent Transactions
                </h2>

                <p className="mt-0.5 text-xs text-zinc-500">
                  Your latest wallet activity
                </p>

              </div>

              {history.length > 0 && (
                <span className="text-xs text-zinc-500">
                  {history.length}{" "}
                  {history.length === 1
                    ? "transaction"
                    : "transactions"}
                </span>
              )}

            </div>

            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

              {recentTransactions.length === 0 ? (

                <div className="px-5 py-8 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
                    <Wallet size={21} />
                  </div>

                  <p className="mt-3 text-sm font-medium text-zinc-300">
                    No transactions yet
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Your wallet activity will appear here.
                  </p>

                </div>

              ) : (

                <div>

                  {recentTransactions.map(
                    (item, index) => {

                      const isCredit =
                        item.type === "credit" ||
                        item.type === "refund";

                      return (
                        <div
                          key={
                            item.payment_id ||
                            item.order_token ||
                            `${item.date}-${item.amount}-${index}`
                          }
                          className={`flex items-center justify-between gap-3 px-4 py-4 ${
                            index !==
                            recentTransactions.length - 1
                              ? "border-b border-zinc-800"
                              : ""
                          }`}
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                isCredit
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {item.type ===
                              "refund" ? (
                                <Gift size={18} />
                              ) : isCredit ? (
                                <ArrowDownLeft
                                  size={18}
                                />
                              ) : (
                                <ArrowUpRight
                                  size={18}
                                />
                              )}
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-white">
                                {item.reason ||
                                  "Wallet transaction"}
                              </p>

                              <p className="mt-1 truncate text-[11px] text-zinc-500">
                                {item.date}
                              </p>

                            </div>

                          </div>

                          <p
                            className={`shrink-0 text-sm font-bold ${
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
                          </p>

                        </div>
                      );
                    }
                  )}

                </div>

              )}

            </div>

            {/* View all */}

            {history.length > 0 && (
              <button
              type="button"
              onClick={() =>
                router.push("/wallet/transactions")
              }
              className="mt-3 flex w-full items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-4 text-left transition hover:border-orange-500/40 hover:bg-zinc-800 active:scale-[0.99]"
            >
                <div>

                  <p className="text-sm font-semibold">
                    View wallet transactions
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    See your complete wallet history
                  </p>

                </div>

                <ChevronRight
                  size={19}
                  className="text-zinc-500"
                />

              </button>
            )}

          </section>

        </div>

      </main>
    </>
  );
}