"use client";

import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

interface OrderItem {
  name?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  total?: number;
  [key: string]: any;
}

interface Order {
  order_id: string;
  token?: number;

  name?: string;
  email?: string;
  user_email?: string;
  phone?: string;
  location?: string;

  items?: OrderItem[];

  total?: number;
  payment_amount?: number;

  status?: string;
  payment_status?: string;
  payment_method?: string;

  payment_id?: string;
  razorpay_order_id?: string;

  created_at?: string;
  payment_date?: string;
  date?: string;

  estimated_time?: string;
  pickup_code?: number;
}

interface OrdersResponse {
  success: boolean;
  orders: Order[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [paymentStatus, setPaymentStatus] =
    useState("ALL");

  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null);

  const [page, setPage] =
    useState(1);

  const [pages, setPages] =
    useState(0);

  const loadOrders = async (
    requestedPage = page
  ) => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem(
          "access_token"
        );

      const params =
        new URLSearchParams();

      params.set(
        "page",
        String(requestedPage)
      );

      params.set(
        "limit",
        "20"
      );

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      params.set(
        "status_filter",
        statusFilter
      );

      params.set(
        "payment_status",
        paymentStatus
      );

      const response =
        await fetch(
          `${API_URL}/admin/orders?${params.toString()}`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      const data:
        OrdersResponse =
        await response.json();

      console.log(
        "Orders API:",
        data
      );

      setOrders(
        data.orders || []
      );

      setPages(
        data.pages || 0
      );

      setPage(
        data.page || requestedPage
      );

    } catch (error) {

      console.error(
        "Failed to load orders:",
        error
      );

      alert(
        "Failed to load orders"
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadOrders(1);
  }, [
    statusFilter,
    paymentStatus,
  ]);

  const handleSearch = () => {
    loadOrders(1);
  };

  const getCustomerEmail = (
    order: Order
  ) => {
    return (
      order.email ||
      order.user_email ||
      "—"
    );
  };

  const getOrderTotal = (
    order: Order
  ) => {
    return (
      order.total ??
      order.payment_amount ??
      0
    );
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
    value?: string
  ) => {
    if (!value) {
      return "—";
    }

    try {
      return new Date(
        value
      ).toLocaleString(
        "en-IN"
      );
    } catch {
      return value;
    }
  };

  const getItemName = (
    item: OrderItem
  ) => {
    return (
      item.name ||
      item.food_name ||
      item.title ||
      item.food ||
      "Unnamed item"
    );
  };

  const getItemQuantity = (
    item: OrderItem
  ) => {
    return (
      item.quantity ??
      1
    );
  };

  const getItemPrice = (
    item: OrderItem
  ) => {
    return (
      item.price ??
      item.amount ??
      0
    );
  };

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-10">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

        <div>

          <h1 className="text-4xl font-bold">
            Orders Management
          </h1>

          <p className="text-gray-400 mt-2">
            Manage and monitor real customer orders.
          </p>

        </div>

        <button
          onClick={() =>
            loadOrders(page)
          }
          className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

      </div>

      {/* FILTERS */}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mt-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* SEARCH */}

          <div className="flex gap-3 min-w-0">

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  handleSearch();
                }
              }}
              placeholder="Search order, token or customer..."
              className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
            />

            <button
              onClick={handleSearch}
              className="bg-orange-500 hover:bg-orange-600 px-4 rounded-xl shrink-0"
            >
              <Search size={20} />
            </button>

          </div>

          {/* ORDER STATUS */}

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
          >

            <option value="ALL">
              All Order Status
            </option>

            <option value="Preparing">
              Preparing
            </option>

            <option value="Cooking">
              Cooking
            </option>

            <option value="Ready For Pickup">
              Ready For Pickup
            </option>

            <option value="Completed">
              Completed
            </option>

          </select>

          {/* PAYMENT STATUS */}

          <select
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(
                event.target.value
              )
            }
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3"
          >

            <option value="ALL">
              All Payment Status
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Failed">
              Failed
            </option>

          </select>

        </div>

      </div>

      {/* TABLE */}

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl mt-8 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-zinc-800">

              <tr className="text-left text-gray-300">

                <th className="px-5 py-4">
                  Order / Token
                </th>

                <th className="px-5 py-4">
                  Customer
                </th>

                <th className="px-5 py-4">
                  Email
                </th>

                <th className="px-5 py-4">
                  Items
                </th>

                <th className="px-5 py-4">
                  Total
                </th>

                <th className="px-5 py-4">
                  Order Status
                </th>

                <th className="px-5 py-4">
                  Payment
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
                    colSpan={9}
                    className="text-center py-12 text-gray-400"
                  >
                    Loading orders...
                  </td>

                </tr>

              ) : orders.length === 0 ? (

                <tr>

                  <td
                    colSpan={9}
                    className="text-center py-12 text-gray-400"
                  >
                    No orders found.
                  </td>

                </tr>

              ) : (

                orders.map(
                  (order) => (

                    <tr
                      key={
                        order.order_id
                      }
                      className="border-t border-zinc-800 hover:bg-zinc-800/50"
                    >

                      {/* ORDER / TOKEN */}

                      <td className="px-5 py-4">

                        <div className="font-semibold text-orange-400">
                          Token #
                          {order.token ??
                            "—"}
                        </div>

                        <div className="text-xs text-gray-500 font-mono mt-1">
                          {order.order_id}
                        </div>

                      </td>

                      {/* CUSTOMER */}

                      <td className="px-5 py-4">

                        {order.name ||
                          "—"}

                      </td>

                      {/* EMAIL */}

                      <td className="px-5 py-4 text-gray-400">

                        {getCustomerEmail(
                          order
                        )}

                      </td>

                      {/* ITEMS */}

                      <td className="px-5 py-4">

                        <div className="space-y-1">

                          {order.items?.length ? (

                            order.items
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  item,
                                  index
                                ) => (

                                  <div
                                    key={
                                      index
                                    }
                                    className="text-sm"
                                  >

                                    {getItemName(
                                      item
                                    )}

                                    <span className="text-gray-400">
                                      {" "}
                                      ×{" "}
                                      {
                                        getItemQuantity(
                                          item
                                        )
                                      }
                                    </span>

                                  </div>

                                )
                              )

                          ) : (

                            <span className="text-gray-500">
                              —
                            </span>

                          )}

                          {(
                            order.items
                              ?.length ||
                            0
                          ) > 3 && (

                            <span className="text-xs text-gray-500">

                              +
                              {(
                                order.items
                                  ?.length ||
                                0
                              ) - 3}{" "}
                              more

                            </span>

                          )}

                        </div>

                      </td>

                      {/* TOTAL */}

                      <td className="px-5 py-4 font-semibold">

                        {formatAmount(
                          getOrderTotal(
                            order
                          )
                        )}

                      </td>

                      {/* ORDER STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-500/20 text-orange-400"
                        >
                          {order.status ||
                            "—"}
                        </span>

                      </td>

                      {/* PAYMENT STATUS */}

                      <td className="px-5 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            order.payment_status ===
                            "Paid"
                              ? "bg-green-500/20 text-green-400"
                              : order.payment_status ===
                                "Pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >

                          {order.payment_status ||
                            "—"}

                        </span>

                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 text-sm text-gray-400">

                        {formatDate(
                          order.created_at ||
                          order.date
                        )}

                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4">

                        <button
                          onClick={() =>
                            setSelectedOrder(
                              order
                            )
                          }
                          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg"
                        >

                          <Eye size={16} />

                          View

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

      {/* PAGINATION */}

      {pages > 1 && (

        <div className="flex items-center justify-center gap-3 mt-6">

          <button
            disabled={page <= 1}
            onClick={() =>
              loadOrders(
                page - 1
              )
            }
            className="bg-zinc-800 disabled:opacity-40 px-4 py-2 rounded-lg"
          >
            Previous
          </button>

          <span className="text-gray-400">
            Page {page} of {pages}
          </span>

          <button
            disabled={
              page >= pages
            }
            onClick={() =>
              loadOrders(
                page + 1
              )
            }
            className="bg-zinc-800 disabled:opacity-40 px-4 py-2 rounded-lg"
          >
            Next
          </button>

        </div>

      )}

      {/* ORDER DETAILS MODAL */}

      {selectedOrder && (

        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between p-6 border-b border-zinc-800">

              <div>

                <h2 className="text-2xl font-bold">
                  Order Details
                </h2>

                <p className="text-orange-400 mt-1">
                  Token #
                  {selectedOrder.token ??
                    "—"}
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
              >

                <X size={20} />

              </button>

            </div>

            {/* DETAILS */}

            <div className="p-6 space-y-6">

              {/* CUSTOMER */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Detail
                  label="Customer"
                  value={
                    selectedOrder.name ||
                    "—"
                  }
                />

                <Detail
                  label="Email"
                  value={
                    getCustomerEmail(
                      selectedOrder
                    )
                  }
                />

                <Detail
                  label="Phone"
                  value={
                    selectedOrder.phone ||
                    "—"
                  }
                />

                <Detail
                  label="Location"
                  value={
                    selectedOrder.location ||
                    "—"
                  }
                />

              </div>

              {/* ITEMS */}

              <div>

                <h3 className="text-lg font-semibold mb-3">
                  Ordered Items
                </h3>

                <div className="border border-zinc-800 rounded-xl overflow-hidden">

                  <table className="w-full">

                    <thead className="bg-zinc-800">

                      <tr>

                        <th className="text-left p-3">
                          Item
                        </th>

                        <th className="text-left p-3">
                          Quantity
                        </th>

                        <th className="text-left p-3">
                          Price
                        </th>

                        <th className="text-left p-3">
                          Total
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {selectedOrder.items?.length ? (

                        selectedOrder.items.map(
                          (
                            item,
                            index
                          ) => {

                            const quantity =
                              getItemQuantity(
                                item
                              );

                            const price =
                              getItemPrice(
                                item
                              );

                            const itemTotal =
                              item.total ??
                              (
                                price *
                                quantity
                              );

                            return (

                              <tr
                                key={
                                  index
                                }
                                className="border-t border-zinc-800"
                              >

                                <td className="p-3">
                                  {getItemName(
                                    item
                                  )}
                                </td>

                                <td className="p-3">
                                  {quantity}
                                </td>

                                <td className="p-3">
                                  {formatAmount(
                                    price
                                  )}
                                </td>

                                <td className="p-3 font-semibold">
                                  {formatAmount(
                                    itemTotal
                                  )}
                                </td>

                              </tr>

                            );

                          }
                        )

                      ) : (

                        <tr>

                          <td
                            colSpan={4}
                            className="p-5 text-center text-gray-500"
                          >
                            No item information available.
                          </td>

                        </tr>

                      )}

                    </tbody>

                  </table>

                </div>

              </div>

              {/* PAYMENT / ORDER */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Detail
                  label="Order Status"
                  value={
                    selectedOrder.status ||
                    "—"
                  }
                />

                <Detail
                  label="Payment Status"
                  value={
                    selectedOrder.payment_status ||
                    "—"
                  }
                />

                <Detail
                  label="Payment Method"
                  value={
                    selectedOrder.payment_method ||
                    "—"
                  }
                />

                <Detail
                  label="Order Date"
                  value={formatDate(
                    selectedOrder.created_at ||
                    selectedOrder.date
                  )}
                />

                <Detail
                  label="Payment ID"
                  value={
                    selectedOrder.payment_id ||
                    "—"
                  }
                />

                <Detail
                  label="Razorpay Order ID"
                  value={
                    selectedOrder.razorpay_order_id ||
                    "—"
                  }
                />

                <Detail
                  label="MongoDB Order ID"
                  value={
                    selectedOrder.order_id ||
                    "—"
                  }
                />

              </div>

              {/* TOTAL */}

              <div className="border-t border-zinc-800 pt-5 flex justify-end">

                <div className="text-right">

                  <p className="text-gray-400">
                    Total Amount
                  </p>

                  <p className="text-3xl font-bold text-orange-500">
                    {formatAmount(
                      getOrderTotal(
                        selectedOrder
                      )
                    )}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-zinc-800 rounded-xl p-4">

      <p className="text-sm text-gray-400">
        {label}
      </p>

      <p className="font-semibold mt-1 break-all">
        {value}
      </p>

    </div>
  );
}