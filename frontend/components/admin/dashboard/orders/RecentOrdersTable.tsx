"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

import { getRecentOrders } from "@/app/lib/api";
import useOrdersSocket from "@/hooks/useOrdersSocket";

type Order = {
  token: number;
  name: string;
  total: number;
  status: string;
  date: string;
};

const filters = [
  "All",
  "Preparing",
  "Processing",
  "Completed",
  "Cancelled",
];

const statusColor: Record<string, string> = {
  Preparing: "bg-yellow-500/20 text-yellow-500",
  Processing: "bg-blue-500/20 text-blue-500",
  Completed: "bg-green-500/20 text-green-500",
  Cancelled: "bg-red-500/20 text-red-500",
};

export default function RecentOrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortBy, setSortBy] = useState("token");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);

        const data = await getRecentOrders(
          page,
          rowsPerPage,
          status,
          search,
          sortBy,
          sortOrder
        );

        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotalOrders(data.total);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [
    page,
    rowsPerPage,
    status,
    search,
    sortBy,
    sortOrder,
  ]);

  useOrdersSocket((message) => {
    console.log("📦 Live Order Event:", message);
  });

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        status === "All" || order.status === status;

      const matchesSearch =
        order.name
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        order.token.toString().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [orders, status, search]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }

    setPage(1);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-colors duration-200">
      <div className="mb-6 flex flex-col gap-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">
              Recent Orders
            </h2>

            <p className="mt-1 text-sm text-text-secondary">
              Latest customer orders
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search
              className="absolute left-3 top-3 text-text-muted"
              size={18}
            />

            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search orders..."
              className="w-full rounded-xl border border-input-border bg-input py-2 pl-10 pr-4 text-text-primary outline-none placeholder:text-text-muted transition-colors focus:border-brand"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setStatus(filter);
                setPage(1);
              }}
              className={`rounded-xl px-4 py-2 text-sm transition-all ${
                status === filter
                  ? "bg-brand text-white shadow-sm"
                  : "bg-surface text-text-secondary hover:bg-card-hover hover:text-text-primary"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th
                onClick={() => handleSort("token")}
                className="cursor-pointer py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  Order

                  {sortBy === "token" &&
                    (sortOrder === "asc" ? (
                      <ArrowUp size={15} />
                    ) : (
                      <ArrowDown size={15} />
                    ))}
                </div>
              </th>

              <th
                onClick={() => handleSort("name")}
                className="cursor-pointer py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  Customer

                  {sortBy === "name" &&
                    (sortOrder === "asc" ? (
                      <ArrowUp size={15} />
                    ) : (
                      <ArrowDown size={15} />
                    ))}
                </div>
              </th>

              <th
                onClick={() => handleSort("total")}
                className="cursor-pointer py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  Amount

                  {sortBy === "total" &&
                    (sortOrder === "asc" ? (
                      <ArrowUp size={15} />
                    ) : (
                      <ArrowDown size={15} />
                    ))}
                </div>
              </th>

              <th
                onClick={() => handleSort("status")}
                className="cursor-pointer py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  Status

                  {sortBy === "status" &&
                    (sortOrder === "asc" ? (
                      <ArrowUp size={15} />
                    ) : (
                      <ArrowDown size={15} />
                    ))}
                </div>
              </th>

              <th
                onClick={() => handleSort("date")}
                className="cursor-pointer py-3 text-right"
              >
                <div className="flex items-center justify-end gap-2">
                  Time

                  {sortBy === "date" &&
                    (sortOrder === "asc" ? (
                      <ArrowUp size={15} />
                    ) : (
                      <ArrowDown size={15} />
                    ))}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order.token}
                className="border-b border-border transition hover:bg-card-hover"
              >
                <td className="py-4 font-semibold text-text-primary">
                  #{order.token}
                </td>

                <td className="text-text-secondary">
                  {order.name}
                </td>

                <td className="font-semibold text-text-primary">
                  ₹{order.total}
                </td>

                <td>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColor[order.status] ??
                      "bg-surface text-text-secondary"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>

                <td className="text-right text-text-secondary">
                  {order.date}
                </td>
              </tr>
            ))}

            {!loading && filteredOrders.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-sm text-text-muted"
                >
                  No orders found.
                </td>
              </tr>
            )}

            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-sm text-text-secondary"
                >
                  Loading orders...
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                Rows per page
              </span>

              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-input-border bg-input px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-brand"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <span className="text-sm text-text-muted">
              {orders.length === 0
                ? "0"
                : `${(page - 1) * rowsPerPage + 1}-${Math.min(
                    page * rowsPerPage,
                    totalOrders
                  )}`}{" "}
              of {totalOrders}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-input-border bg-input p-2 text-text-secondary transition hover:bg-card-hover hover:text-text-primary disabled:opacity-40"
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => (
                <button
                  key={index}
                  onClick={() => setPage(index + 1)}
                  className={`h-9 w-9 rounded-lg transition ${
                    page === index + 1
                      ? "bg-brand text-white"
                      : "bg-surface text-text-secondary hover:bg-card-hover hover:text-text-primary"
                  }`}
                >
                  {index + 1}
                </button>
              )
            )}

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-input-border bg-input p-2 text-text-secondary transition hover:bg-card-hover hover:text-text-primary disabled:opacity-40"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}