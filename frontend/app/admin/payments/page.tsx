"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Search,
  RefreshCw,
  Download,
  Eye,
  CreditCard,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type Customer = {
  name?: string;
  email?: string;
  phone?: string;
};

type Payment = {
  database_id: string;
  payment_id: string;
  order_id: string | null;
  razorpay_order_id: string | null;
  customer: Customer | null;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  purpose: string | null;
  payment_date: string | null;
  refund_status: string | null;
  refund_amount: number;
  refund_date: string | null;
  refund_payment_id: string | null;
};

type PaymentStats = {
  total_transactions: number;
  total_amount: number;
  paid_transactions: number;
  pending_transactions: number;
  failed_transactions: number;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);

  const [stats, setStats] = useState<PaymentStats>({
    total_transactions: 0,
    total_amount: 0,
    paid_transactions: 0,
    pending_transactions: 0,
    failed_transactions: 0,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");

  const [loading, setLoading] = useState(true);

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

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${API_URL}/admin/payments`,
        {
          params: {
            page: 1,
            limit: 10,
            search,
            status_filter: statusFilter,
            payment_method: paymentMethod,
          },
          headers: getAuthHeaders(),
        }
      );

      setPayments(response.data.payments || []);
    } catch (error: any) {
      console.error(
        "Fetch payments error:",
        error
      );

      if (error?.response?.status === 401) {
        toast.error(
          "Session expired. Please login again."
        );
      } else if (error?.response?.status === 403) {
        toast.error(
          "Admin access required."
        );
      } else {
        toast.error(
          "Failed to load payments."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/admin/payments/stats`,
        {
          params: {
            status_filter: statusFilter,
            payment_method: paymentMethod,
          },
          headers: getAuthHeaders(),
        }
      );

      setStats({
        total_transactions:
          response.data.total_transactions || 0,

        total_amount:
          response.data.total_amount || 0,

        paid_transactions:
          response.data.paid_transactions || 0,

        pending_transactions:
          response.data.pending_transactions || 0,

        failed_transactions:
          response.data.failed_transactions || 0,
      });
    } catch (error) {
      console.error(
        "Fetch payment stats error:",
        error
      );
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [
    statusFilter,
    paymentMethod,
  ]);

  const handleSearch = () => {
    fetchPayments();
  };

  const handleRefresh = () => {
    fetchPayments();
    fetchStats();
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/admin/payments/export`,
        {
          params: {
            status_filter: statusFilter,
            payment_method: paymentMethod,
          },
          headers: getAuthHeaders(),
          responseType: "blob",
        }
      );

      const url =
        window.URL.createObjectURL(
          new Blob([response.data])
        );

      const link =
        document.createElement("a");

      link.href = url;
      link.download = "payments.csv";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      toast.success(
        "Payments exported successfully."
      );
    } catch (error) {
      console.error(
        "Export payments error:",
        error
      );

      toast.error(
        "Failed to export payments."
      );
    }
  };

  const formatAmount = (
    amount: number
  ) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(amount);
  };

  const formatDate = (
    date: string | null
  ) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString(
        "en-IN"
      );
    } catch {
      return date;
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

        <div>
          <div className="flex items-center gap-3">

            <CreditCard
              className="text-orange-500"
              size={34}
            />

            <h1 className="text-4xl font-bold">
              Payment Management
            </h1>

          </div>

          <p className="text-gray-400 mt-2">
            Manage and monitor all payment transactions.
          </p>
        </div>

        <div className="flex gap-3">

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 px-4 py-3 rounded-xl font-semibold"
          >
            <Download size={18} />
            Export CSV
          </button>

        </div>
      </div>

      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5 mt-10">

        <StatCard
          title="Total Transactions"
          value={stats.total_transactions}
        />

        <StatCard
          title="Total Amount"
          value={formatAmount(
            stats.total_amount
          )}
        />

        <StatCard
          title="Paid"
          value={stats.paid_transactions}
        />

        <StatCard
          title="Pending"
          value={stats.pending_transactions}
        />

        <StatCard
          title="Failed"
          value={stats.failed_transactions}
        />

      </div>

      {/* FILTERS */}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mt-8">

        {/*
          IMPORTANT:
          The controls are now placed in one responsive flex container.

          gap-4 = clear spacing between every separate control.

          flex-col:
          Mobile/tablet-small screens stack the controls vertically.

          md:flex-row:
          Medium and larger screens place them horizontally.

          flex-1 / md:flex-[1.5]:
          Search gets more width than the dropdowns without
          changing the dropdown sizes unnecessarily.
        */}

        <div className="flex flex-col md:flex-row items-stretch gap-4">

          {/* SEARCH CONTROL */}

          <div className="flex flex-1 min-w-0 gap-3">

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="Search payment, order or customer..."
              className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
            />

            <button
              onClick={handleSearch}
              className="bg-orange-500 px-4 rounded-xl shrink-0"
            >
              <Search size={20} />
            </button>

          </div>

          {/* STATUS FILTER */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="w-full md:w-48 shrink-0 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
          >
            <option value="ALL">
              All Status
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Failed">
              Failed
            </option>
          </select>

          {/* PAYMENT METHOD FILTER */}

          <select
            value={paymentMethod}
            onChange={(e) =>
              setPaymentMethod(e.target.value)
            }
            className="w-full md:w-56 shrink-0 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
          >
            <option value="ALL">
              All Payment Methods
            </option>

            <option value="ONLINE">
              Online
            </option>

            <option value="WALLET">
              Wallet
            </option>
          </select>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl mt-8 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-zinc-800">

              <tr className="text-left text-gray-300">

                <th className="px-5 py-4">
                  Payment ID
                </th>

                <th className="px-5 py-4">
                  Customer
                </th>

                <th className="px-5 py-4">
                  Order ID
                </th>

                <th className="px-5 py-4">
                  Amount
                </th>

                <th className="px-5 py-4">
                  Method
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4">
                  Date
                </th>

                <th className="px-5 py-4">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan={8}
                    className="text-center py-12 text-gray-400"
                  >
                    Loading payments...
                  </td>

                </tr>

              ) : payments.length === 0 ? (

                <tr>

                  <td
                    colSpan={8}
                    className="text-center py-12 text-gray-400"
                  >
                    No payments found.
                  </td>

                </tr>

              ) : (

                payments.map(
                  (payment) => (

                    <tr
                      key={payment.payment_id}
                      className="border-t border-zinc-800 hover:bg-zinc-800/50"
                    >

                      <td className="px-5 py-4 font-mono text-sm text-orange-400">
                        {payment.payment_id}
                      </td>

                      <td className="px-5 py-4">

                        <div className="font-semibold">
                          {payment.customer?.name || "Unknown"}
                        </div>

                        <div className="text-sm text-gray-400">
                          {payment.customer?.email || "—"}
                        </div>

                      </td>

                      <td className="px-5 py-4 font-mono text-sm">
                        {payment.order_id || "—"}
                      </td>

                      <td className="px-5 py-4 font-semibold">
                        {formatAmount(payment.amount)}
                      </td>

                      <td className="px-5 py-4">
                        {payment.payment_method || "—"}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            payment.status === "Paid"
                              ? "bg-green-500/20 text-green-400"
                              : payment.status === "Pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {payment.status}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-sm text-gray-400">
                        {formatDate(payment.payment_date)}
                      </td>

                      <td className="px-5 py-4">

                        <button
                          onClick={() =>
                            (window.location.href =
                              `/admin/payments/${payment.payment_id}`)
                          }
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
                          title="View payment"
                        >
                          <Eye size={18} />
                        </button>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <p className="text-gray-400">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>

    </div>
  );
}