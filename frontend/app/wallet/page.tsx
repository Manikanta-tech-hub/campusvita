"use client";

import axios from "axios";

import toast from "react-hot-toast";

import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import Navbar from "@/components/layout/Navbar";

import { useCart } from "../../context/CartContext";

type WalletHistory = {
  type: string;
  amount: number;
  reason: string;
  date: string;
};

export default function WalletPage() {

  const { cartItems } = useCart();

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [amount, setAmount] =
    useState("");

  const [history, setHistory] =
    useState<WalletHistory[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [email, setEmail] =
    useState("");

  useEffect(() => {

    const savedEmail =
      localStorage.getItem("email");

    if (!savedEmail) {

      window.location.href = "/login";

      return;

    }

    setEmail(savedEmail);

    fetchWallet(savedEmail);

  }, []);

  const fetchWallet = async (
    userEmail: string
  ) => {

    try {

      const response =
        await axios.get(
          `http://127.0.0.1:8000/wallet-history/${userEmail}`
        );

      setHistory(
        response.data.history
      );

      const profileResponse =
        await axios.get(
          `http://127.0.0.1:8000/profile/${userEmail}`
        );

      setWalletBalance(
        profileResponse.data.wallet
      );

    } catch {

      toast.error(
        "Failed To Load Wallet"
      );

    } finally {

      setLoading(false);

    }

  };

  const handleAddMoney =
    async () => {

      if (!amount) {

        toast.error(
          "Enter Amount"
        );

        return;

      }

      try {

        const response =
          await axios.post(
            "http://127.0.0.1:8000/add-money",
            {
              email,
              amount:
                Number(amount),
            }
          );

        toast.success(
          response.data.message
        );

        setWalletBalance(
          response.data.wallet_balance
        );

        fetchWallet(email);

        setAmount("");

      } catch {

        toast.error(
          "Failed To Add Money"
        );

      }

    };

  if (loading) {

    return (

      <main className="min-h-screen bg-black flex items-center justify-center text-white">

        Loading Wallet...

      </main>

    );

  }

  return (

    <>
      <Navbar/>

      <main className="min-h-screen bg-black text-white p-6 md:p-10">

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

                ₹{walletBalance}

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
              placeholder="Enter Amount"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              className="flex-1 bg-zinc-800 p-4 rounded-2xl outline-none"
            />

            <button
              onClick={
                handleAddMoney
              }
              className="bg-orange-500 hover:bg-orange-600 transition-all px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3"
            >

              <Plus />

              Add Money

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
                (item, index) => (

                  <div
                    key={index}
                    className="bg-zinc-800 p-5 rounded-2xl flex justify-between items-center"
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
                      className={`text-2xl font-bold ${
                        item.type ===
                          "credit" ||
                        item.type ===
                          "refund"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >

                      {item.type ===
                        "credit" ||
                      item.type ===
                        "refund"
                        ? "+"
                        : "-"}

                      ₹{item.amount}

                    </h2>

                  </div>

                )
              )

            )}

          </div>

        </div>

      </main>

    </>

  );

}