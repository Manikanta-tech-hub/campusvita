"use client";

import {
  getAccessToken,
} from "@/app/lib/auth/session";

import {
  loadRazorpay,
} from "@/app/lib/payment/razorpay";

import axios from "axios";
import toast from "react-hot-toast";

import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

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

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [amount, setAmount] =
    useState("");

  const [history, setHistory] =
    useState<WalletHistory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  // ============================================================
  // AUTH TOKEN
  // ============================================================

  const getToken = () => {
    return getAccessToken("USER");
  };

  // ============================================================
  // LOAD REAL WALLET DATA
  // ============================================================

  const fetchWallet = async () => {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.get(
        `${API_URL}/wallet/balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWalletBalance(
        Number(
          response.data?.balance || 0
        )
      );

      setHistory(
        Array.isArray(
          response.data?.history
        )
          ? response.data.history
          : []
      );
    } catch (error: any) {
      console.error(
        "Wallet fetch error:",
        error
      );

      if (
        error?.response?.status === 401
      ) {
        toast.error(
          "Session expired. Please login again."
        );

        router.replace("/login");
      } else {
        toast.error(
          "Failed to load wallet"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL WALLET LOAD
  // ============================================================

  useEffect(() => {
    void fetchWallet();
  }, []);

  // ============================================================
  // VERIFY WALLET TOP-UP
  // ============================================================

  const verifyWalletTopup = async (
    paymentResponse: any,
    orderIntent: string
  ) => {
    try {
      const token = getToken();

      if (!token) {
        toast.error(
          "Your session has expired. Please login again."
        );

        router.replace("/login");
        return;
      }

      const response = await axios.post(
        `${API_URL}/wallet/verify-topup`,
        {
          razorpay_payment_id:
            paymentResponse?.razorpay_payment_id,

          razorpay_order_id:
            paymentResponse?.razorpay_order_id,

          razorpay_signature:
            paymentResponse?.razorpay_signature,

          order_intent:
            orderIntent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        response.data;

      if (!data?.success) {
        throw new Error(
          data?.message ||
            "Wallet verification failed"
        );
      }

      toast.success(
        `₹${Number(
          data.amount_added || 0
        ).toFixed(2)} added to wallet 🚀`
      );

      setAmount("");

      await fetchWallet();
    } catch (error: any) {
      console.error(
        "Wallet verification error:",
        error
      );

      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          error?.message ||
          "Wallet payment verification failed"
      );
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // ADD MONEY
  // ============================================================

  const handleAddMoney = async () => {
    const numericAmount =
      Number(amount);

    if (!amount.trim()) {
      toast.error(
        "Enter amount"
      );

      return;
    }

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      toast.error(
        "Enter a valid amount"
      );

      return;
    }

    if (processing) {
      return;
    }

    if (numericAmount < 1) {
      toast.error(
        "Minimum wallet amount is ₹1"
      );

      return;
    }

    try {
      setProcessing(true);

      const token =
        getToken();

      if (!token) {
        toast.error(
          "Your session has expired. Please login again."
        );

        router.replace("/login");

        setProcessing(false);

        return;
      }

      const razorpayReady =
        await loadRazorpay();

      if (
        !razorpayReady ||
        !window.Razorpay
      ) {
        throw new Error(
          "Unable to load Razorpay. Please try again."
        );
      }

      const response =
        await axios.post(
          `${API_URL}/wallet/create-topup-order`,
          {
            amount:
              numericAmount,
          },
          {
            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );

      const orderData =
        response.data;

      console.log(
        "💰 Wallet Razorpay order:",
        orderData
      );

      if (
        !orderData?.success
      ) {
        throw new Error(
          orderData?.message ||
            "Failed to create wallet payment"
        );
      }

      if (
        !orderData?.order_id
      ) {
        throw new Error(
          "Razorpay order was not created"
        );
      }

      if (
        !orderData?.key
      ) {
        throw new Error(
          "Razorpay key was not returned by the server"
        );
      }

      if (
        !orderData?.order_intent
      ) {
        throw new Error(
          "Payment security intent was not created"
        );
      }

      const options = {
        key:
          orderData.key,

        amount:
          orderData.amount,

        currency:
          orderData.currency ||
          "INR",

        name:
          "CampusVita",

        description:
          "CampusVita Wallet Top-up",

        order_id:
          orderData.order_id,

        prefill: {
          name:
            orderData.name ||
            "",

          email:
            orderData.email ||
            "",

          contact:
            orderData.phone ||
            "",
        },

        theme: {
          color:
            "#f97316",
        },

        handler:
          async function (
            paymentResponse: any
          ) {
            console.log(
              "✅ Razorpay wallet payment response:",
              paymentResponse
            );

            await verifyWalletTopup(
              paymentResponse,
              orderData.order_intent
            );
          },

        modal: {
          ondismiss: () => {
            console.log(
              "Wallet payment cancelled"
            );

            setProcessing(false);

            toast(
              "Payment cancelled. Your wallet was not changed."
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(
          options
        );

      razorpay.on(
        "payment.failed",
        (
          response: any
        ) => {
          console.error(
            "❌ Razorpay wallet payment failed:",
            response?.error
          );

          toast.error(
            response?.error
              ?.description ||
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

      const message =
        error?.response?.data
          ?.detail ||
        error?.response?.data
          ?.message ||
        error?.message ||
        "Unable to start wallet payment";

      toast.error(
        message
      );

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

        <main className="min-h-screen bg-[var(--background)] px-4 pb-24 pt-6 text-[var(--text-primary)] md:px-6">
          <div className="mx-auto w-full max-w-5xl">
            <div className="animate-pulse">
              <div className="h-7 w-32 rounded-lg bg-[var(--surface-secondary)]" />

              <div className="mt-2 h-4 w-56 rounded bg-[var(--surface-secondary)]" />

              <div className="mt-6 h-44 rounded-[28px] bg-[var(--surface)]" />

              <div className="mt-5 h-72 rounded-[28px] bg-[var(--surface)]" />
            </div>
          </div>
        </main>
      </>
    );
  }

  // ============================================================
  // RECENT TRANSACTIONS
  // ============================================================

  const recentTransactions =
    history.slice(0, 4);

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[var(--background)] px-4 pb-24 pt-5 text-[var(--text-primary)] md:px-6 md:pt-8">
        <div className="mx-auto w-full max-w-5xl">

          {/* ==================================================
              HEADER
              ================================================== */}

          <header className="mb-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
              <Wallet className="h-4 w-4" />
              CampusVita Wallet
            </div>

            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              My Wallet
            </h1>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage your balance and wallet activity securely.
            </p>
          </header>

          {/* ==================================================
              DESKTOP GRID
              ================================================== */}

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">

            {/* ==================================================
                LEFT COLUMN
                ================================================== */}

            <div className="space-y-5">

              {/* ==================================================
                  BALANCE CARD
                  ================================================== */}

              <section className="relative overflow-hidden rounded-[28px] border border-orange-500/20 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-6 text-white shadow-[0_22px_60px_rgba(249,115,22,0.18)] sm:p-7">

                <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

                <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-black/10 blur-3xl" />

                <div className="relative">

                  <div className="flex items-center justify-between gap-4">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                        <Wallet
                          size={21}
                          strokeWidth={2.3}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-orange-50">
                          Wallet Balance
                        </p>

                        <p className="mt-0.5 text-[11px] text-orange-100/80">
                          Available to spend
                        </p>
                      </div>

                    </div>

                    <Sparkles className="h-5 w-5 text-orange-100/70" />

                  </div>

                  <div className="mt-8">

                    <p className="text-4xl font-black tracking-tight sm:text-5xl">
                      ₹{walletBalance.toFixed(2)}
                    </p>

                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/10 px-3 py-1.5 text-[11px] font-semibold text-orange-50">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      Ready for your next order
                    </div>

                  </div>

                </div>
              </section>

              {/* ==================================================
                  ADD MONEY
                  ================================================== */}

              <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[var(--brand)]" />

                      <h2 className="text-lg font-black">
                        Add Money
                      </h2>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                      Add funds securely using Razorpay.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <Plus size={19} />
                  </div>

                </div>

                {/* Amount input */}

                <div className="mt-5">

                  <label
                    htmlFor="wallet-amount"
                    className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]"
                  >
                    Amount
                  </label>

                  <div className="flex items-center rounded-2xl border border-[var(--border)] bg-[var(--input)] px-4 transition focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-orange-500/10">

                    <span className="mr-2 text-xl font-bold text-[var(--text-muted)]">
                      ₹
                    </span>

                    <input
                      id="wallet-amount"
                      type="number"
                      min="1"
                      inputMode="decimal"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={(event) =>
                        setAmount(
                          event.target.value
                        )
                      }
                      disabled={processing}
                      className="h-13 w-full bg-transparent text-base font-semibold text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] disabled:cursor-not-allowed disabled:opacity-60"
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
                            String(
                              quickAmount
                            )
                          )
                        }
                        disabled={processing}
                        className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                          Number(amount) ===
                          quickAmount
                            ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                            : "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:border-orange-500/50 hover:text-[var(--brand)]"
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
                  onClick={
                    handleAddMoney
                  }
                  disabled={
                    processing
                  }
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--brand)] text-sm font-black text-white shadow-lg shadow-orange-500/15 transition hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Processing payment...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Money
                    </>
                  )}
                </button>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-[var(--text-muted)]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secure payment powered by Razorpay
                </div>

              </section>

            </div>

            {/* ==================================================
                RIGHT COLUMN
                ================================================== */}

            <section>

              <div className="mb-3 flex items-end justify-between gap-4">

                <div>
                  <h2 className="text-lg font-black">
                    Recent Transactions
                  </h2>

                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Your latest wallet activity.
                  </p>
                </div>

                {history.length > 0 && (
                  <span className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">
                    {history.length}{" "}
                    {history.length === 1
                      ? "transaction"
                      : "transactions"}
                  </span>
                )}

              </div>

              <div className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">

                {recentTransactions.length ===
                0 ? (

                  <div className="px-5 py-12 text-center">

                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                      <Wallet size={23} />
                    </div>

                    <p className="mt-4 text-sm font-bold">
                      No transactions yet
                    </p>

                    <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--text-secondary)]">
                      Your wallet activity will appear here after you add money or use your wallet for an order.
                    </p>

                  </div>

                ) : (

                  <div>

                    {recentTransactions.map(
                      (
                        item,
                        index
                      ) => {

                        const isCredit =
                          item.type ===
                            "credit" ||
                          item.type ===
                            "refund";

                        return (
                          <div
                            key={
                              item.payment_id ||
                              item.order_token ||
                              `${item.date}-${item.amount}-${index}`
                            }
                            className={`flex items-center justify-between gap-3 px-4 py-4 transition hover:bg-[var(--surface-secondary)] sm:px-5 ${
                              index !==
                              recentTransactions.length - 1
                                ? "border-b border-[var(--border)]"
                                : ""
                            }`}
                          >

                            <div className="flex min-w-0 items-center gap-3">

                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                  isCredit
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                                }`}
                              >
                                {item.type ===
                                "refund" ? (
                                  <Gift size={18} />
                                ) : isCredit ? (
                                  <ArrowDownLeft size={18} />
                                ) : (
                                  <ArrowUpRight size={18} />
                                )}
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                                  {item.reason ||
                                    "Wallet transaction"}
                                </p>

                                <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                                  {item.date}
                                </p>

                              </div>

                            </div>

                            <p
                              className={`shrink-0 text-sm font-black ${
                                isCredit
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
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
                    router.push(
                      "/wallet/transactions"
                    )
                  }
                  className="mt-3 flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-left shadow-[var(--shadow-card)] transition hover:border-orange-500/40 hover:bg-[var(--surface-secondary)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]"
                >

                  <div>

                    <p className="text-sm font-bold">
                      View wallet transactions
                    </p>

                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      See your complete wallet history
                    </p>

                  </div>

                  <ChevronRight
                    size={19}
                    className="text-[var(--text-muted)]"
                  />

                </button>
              )}

            </section>

          </div>

        </div>
      </main>
    </>
  );
}