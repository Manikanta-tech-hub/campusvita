"use client";

import axios from "axios";
import toast from "react-hot-toast";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Wallet,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/layout/Navbar";

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

export default function WalletTransactionsPage() {
  const router = useRouter();

  const [history, setHistory] = useState<WalletHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const getToken = () => {
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token")
    );
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(false);

      const token = getToken();

      if (!token) {
        toast.error("Please login again.");
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

      const realHistory = Array.isArray(
        response.data?.history
      )
        ? response.data.history
        : [];

      setHistory(realHistory);
    } catch (error: any) {
      console.error(
        "Wallet transactions error:",
        error
      );

      setError(true);

      if (error?.response?.status === 401) {
        toast.error(
          "Session expired. Please login again."
        );

        router.replace("/login");
      } else {
        toast.error(
          "Failed to load transactions"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getTransactionIcon = (
    type: string
  ) => {
    if (type === "refund") {
      return (
        <Gift
          size={19}
          strokeWidth={2.2}
        />
      );
    }

    if (type === "credit") {
      return (
        <ArrowDownLeft
          size={19}
          strokeWidth={2.2}
        />
      );
    }

    return (
      <ArrowUpRight
        size={19}
        strokeWidth={2.2}
      />
    );
  };

  const isCredit = (type: string) => {
    return (
      type === "credit" ||
      type === "refund"
    );
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white px-4 pt-5 pb-24 md:px-6 md:pt-8">

        <div className="mx-auto w-full max-w-md">

          {/* HEADER */}

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                router.push("/wallet")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-orange-500/50 hover:text-orange-400 active:scale-95"
              aria-label="Back to wallet"
            >
              <ChevronLeft size={21} />
            </button>

            <div>

              <h1 className="text-2xl font-bold tracking-tight">
                Wallet Transactions
              </h1>

              <p className="mt-1 text-xs text-zinc-500">
                Your real wallet activity
              </p>

            </div>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="mt-5 space-y-3">

              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="h-24 animate-pulse rounded-2xl bg-zinc-900"
                  />
                )
              )}

            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="mt-5 rounded-3xl border border-red-500/20 bg-zinc-900 p-6 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <Wallet size={21} />
              </div>

              <h2 className="mt-3 text-sm font-semibold">
                Unable to load transactions
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Please try again.
              </p>

              <button
                type="button"
                onClick={fetchTransactions}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
              >
                <RefreshCw size={15} />
                Try Again
              </button>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            history.length === 0 && (
              <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-7 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-500">
                  <Wallet size={23} />
                </div>

                <h2 className="mt-4 text-base font-semibold">
                  No wallet transactions yet
                </h2>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Your real wallet activity will
                  appear here after a transaction.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/wallet")
                  }
                  className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-xs font-bold text-white transition hover:bg-orange-600 active:scale-95"
                >
                  Add Money
                </button>

              </div>
            )}

          {/* TRANSACTIONS */}

          {!loading &&
            !error &&
            history.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">

                {history.map(
                  (item, index) => {
                    const credit =
                      isCredit(item.type);

                    return (
                      <div
                        key={
                          item.payment_id ||
                          item.order_token ||
                          `${item.date}-${item.amount}-${index}`
                        }
                        className={`p-4 ${
                          index !==
                          history.length - 1
                            ? "border-b border-zinc-800"
                            : ""
                        }`}
                      >

                        <div className="flex items-start justify-between gap-3">

                          {/* LEFT */}

                          <div className="flex min-w-0 items-start gap-3">

                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                                credit
                                  ? "bg-green-500/10 text-green-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {getTransactionIcon(
                                item.type
                              )}
                            </div>

                            <div className="min-w-0">

                              <p className="text-sm font-semibold text-white">
                                {item.reason ||
                                  "Wallet transaction"}
                              </p>

                              <p className="mt-1 text-[11px] text-zinc-500">
                                {item.date}
                              </p>

                            </div>

                          </div>

                          {/* AMOUNT */}

                          <p
                            className={`shrink-0 text-sm font-bold ${
                              credit
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {credit
                              ? "+"
                              : "-"}
                            ₹
                            {Number(
                              item.amount
                            ).toFixed(2)}
                          </p>

                        </div>

                        {/* DETAILS */}

                        {(item.payment_id ||
                          item.order_token) && (
                          <div className="mt-3 ml-14 space-y-1">

                            {item.payment_id && (
                              <p className="truncate text-[10px] text-zinc-600">
                                Payment ID:{" "}
                                {item.payment_id}
                              </p>
                            )}

                            {item.order_token && (
                              <p className="truncate text-[10px] text-zinc-600">
                                Order Token:{" "}
                                {item.order_token}
                              </p>
                            )}

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>
            )}

        </div>

      </main>
    </>
  );
}