"use client";

import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";

import {
  Trash2,
  Share2,
  X,
  Star,
  PackageCheck,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import { io } from "socket.io-client";

import { getImageUrl } from "@/app/lib/getImageUrl";
import Navbar from "@/components/layout/Navbar";

import { useCart } from "../../context/CartContext";

// ============================================================
// TYPES
// ============================================================

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

type Order = {
  order_id: string;
  items: OrderItem[];
  total: number;
  status: string;
  date: string;
  token: number;
  pickup_code: number;
  estimated_time: string;
  payment_method?: string;
  payment_status?: string;
};

// ============================================================
// API
// ============================================================

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

// ============================================================
// PAGE
// ============================================================

export default function OrdersPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Used only for the order options modal.
  const [selectedOrder, setSelectedOrder] =
    useState<number | null>(null);

  // Used only for expanding/collapsing order details.
  const [expandedOrder, setExpandedOrder] =
    useState<number | null>(null);

  const [showRatingModal, setShowRatingModal] =
    useState(false);

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [feedback, setFeedback] = useState("");

  const [selectedFoodName, setSelectedFoodName] =
    useState("");

  const { addToCart } = useCart();

  // ============================================================
  // GET AUTH TOKEN
  // ============================================================

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("access_token");
  };

  // ============================================================
  // FETCH ORDERS
  // ============================================================

  const fetchOrders = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        }

        const token = getToken();

        if (!token) {
          toast.error("Please login again");
          setOrders([]);
          return;
        }

        const response = await fetch(
          `${API_URL}/orders`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        // ======================================================
        // AUTH ERROR
        // ======================================================

        if (response.status === 401) {
          toast.error(
            "Your session has expired. Please login again."
          );

          setOrders([]);
          return;
        }

        // ======================================================
        // OTHER API ERRORS
        // ======================================================

        if (!response.ok) {
          let errorMessage =
            "Failed to load orders";

          try {
            const errorData =
              await response.json();

            errorMessage =
              errorData.detail ||
              errorData.message ||
              errorMessage;
          } catch {
            // Ignore invalid JSON
          }

          throw new Error(errorMessage);
        }

        // ======================================================
        // PARSE RESPONSE
        // ======================================================

        const data = await response.json();

        console.log(
          "✅ Orders API response:",
          data
        );

        // ======================================================
        // NORMALIZE ORDERS
        // ======================================================

        if (Array.isArray(data.orders)) {
          const normalizedOrders =
            [...data.orders]
              .filter(Boolean)
              .reverse();

          setOrders(normalizedOrders);

          console.log(
            `✅ Loaded ${normalizedOrders.length} orders`
          );
        } else {
          console.warn(
            "⚠️ API returned no orders array:",
            data
          );

          setOrders([]);
        }
      } catch (error) {
        console.error(
          "❌ Fetch orders error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load orders"
        );

        setOrders([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ============================================================
  // LIVE ORDER UPDATES
  // ============================================================

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log(
        "✅ Orders socket connected"
      );
    });

    socket.on(
      "order_update",
      (updatedOrder) => {
        console.log(
          "🔄 Order update received:",
          updatedOrder
        );

        fetchOrders();
      }
    );

    socket.on("disconnect", () => {
      console.log(
        "🔌 Orders socket disconnected"
      );
    });

    socket.on("connect_error", (error) => {
      console.warn(
        "⚠️ Orders socket error:",
        error
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchOrders]);

  // ============================================================
  // REORDER
  // ============================================================

  const handleReorder = (
    items: OrderItem[]
  ) => {
    if (!items || items.length === 0) {
      toast.error(
        "No items available for reorder"
      );

      return;
    }

    items.forEach((item) => {
      addToCart({
        name: item.name,
        price: item.price,
        image: item.image || "",
      });
    });

    toast.success(
      "Items added to cart 🚀"
    );
  };

  // ============================================================
  // DELETE ORDER
  // ============================================================

  const handleDeleteOrder = async (
    orderId: string
  ) => {
    try {
      const token = getToken();

      if (!token) {
        toast.error(
          "Please login again"
        );

        return;
      }

      if (!orderId) {
        toast.error(
          "Invalid order ID"
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/delete-order/${orderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        toast.error(
          "Your session has expired"
        );

        return;
      }

      if (!response.ok) {
        toast.error(
          data.detail ||
            data.message ||
            "Failed to delete order"
        );

        return;
      }

      toast.success(
        data.message ||
          "Order deleted successfully"
      );

      setSelectedOrder(null);
      setExpandedOrder(null);

      await fetchOrders();
    } catch (error) {
      console.error(
        "❌ Delete order error:",
        error
      );

      toast.error(
        "Failed to delete order"
      );
    }
  };

  // ============================================================
  // SHARE ORDER
  // ============================================================

  const handleShareOrder = async (
    order: Order
  ) => {
    const text = `
CampusVita Order 🚀

Token: #${order.token}

Items:
${order.items
  .map(
    (item) =>
      `${item.name} x ${item.quantity}`
  )
  .join("\n")}

Total: ₹${order.total}
`;

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title: "CampusVita Order",
          text,
        });
      } else {
        await navigator.clipboard.writeText(
          text
        );

        toast.success(
          "Order copied to clipboard"
        );
      }
    } catch (error) {
      console.log(
        "Share cancelled:",
        error
      );
    }
  };

  // ============================================================
  // RATE ORDER
  // ============================================================

  const handleRateOrder = async () => {
    if (selectedRating === 0) {
      toast.error(
        "Please select a rating ⭐"
      );

      return;
    }

    if (!selectedFoodName) {
      toast.error(
        "Food item not found"
      );

      return;
    }

    try {
      const token = getToken();

      if (!token) {
        toast.error(
          "Please login again"
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/rate-order`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            food_name:
              selectedFoodName,
            rating:
              selectedRating,
            feedback,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        toast.error(
          data.detail ||
            data.message ||
            "Failed to submit rating"
        );

        return;
      }

      toast.success(
        data.message ||
          "Rating saved ⭐"
      );

      setShowRatingModal(false);
      setSelectedRating(0);
      setFeedback("");
      setSelectedFoodName("");
    } catch (error) {
      console.error(
        "❌ Rating error:",
        error
      );

      toast.error(
        "Failed to submit rating"
      );
    }
  };

  // ============================================================
  // STATUS STYLE
  // ============================================================

  const getStatusStyle = (
    status: string
  ) => {
    const normalizedStatus =
      (status || "")
        .trim()
        .toLowerCase();

    if (
      normalizedStatus ===
        "completed" ||
      normalizedStatus ===
        "delivered"
    ) {
      return {
        dot: "bg-green-500",
        text: "text-green-400",
        label: "Delivered",
      };
    }

    if (
      normalizedStatus ===
        "cancelled" ||
      normalizedStatus ===
        "canceled"
    ) {
      return {
        dot: "bg-red-500",
        text: "text-red-400",
        label: "Cancelled",
      };
    }

    if (
      normalizedStatus ===
        "preparing" ||
      normalizedStatus ===
        "cooking"
    ) {
      return {
        dot: "bg-orange-500",
        text: "text-orange-400",
        label:
          status || "Preparing",
      };
    }

    if (
      normalizedStatus ===
      "ready for pickup"
    ) {
      return {
        dot: "bg-blue-500",
        text: "text-blue-400",
        label:
          status || "Ready",
      };
    }

    return {
      dot: "bg-gray-400",
      text: "text-gray-300",
      label:
        status || "Unknown",
    };
  };

  // ============================================================
  // THUMBNAIL HELPERS
  // ============================================================

  const getVisibleItems = (
    items: OrderItem[]
  ) => {
    return (items || [])
      .filter(Boolean)
      .slice(0, 3);
  };

  const getRemainingItemCount = (
    items: OrderItem[]
  ) => {
    return Math.max(
      (items || []).length - 3,
      0
    );
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    fetchOrders(true);
  };

  // ============================================================
  // OPEN RATING
  // ============================================================

  const openRating = (
    order: Order
  ) => {
    const firstItem =
      order.items?.[0];

    if (!firstItem) {
      toast.error(
        "No food item available to rate"
      );

      return;
    }

    setSelectedFoodName(
      firstItem.name
    );

    setSelectedRating(0);
    setFeedback("");
    setShowRatingModal(true);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-4 pb-28 pt-5 text-white sm:px-6 sm:pt-8 md:px-10 md:pb-10">

        <div className="mx-auto w-full max-w-4xl">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <PackageCheck
                  size={22}
                  className="shrink-0 text-orange-500"
                />

                <h1 className="truncate text-2xl font-bold sm:text-3xl">
                  Order History
                </h1>
              </div>

              <p className="mt-1 text-sm text-zinc-500">
                Your recent CampusVita orders
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh orders"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 transition-all hover:border-orange-500 hover:text-orange-500 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
            </button>

          </div>

          {/* ================================================== */}
          {/* LOADING */}
          {/* ================================================== */}

          {loading ? (
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">

              <RefreshCw
                size={32}
                className="mx-auto animate-spin text-orange-500"
              />

              <p className="mt-4 text-sm text-zinc-400">
                Loading your orders...
              </p>

            </div>
          ) : orders.length === 0 ? (

            /* ================================================= */
            /* EMPTY STATE */
            /* ================================================= */

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center sm:p-12">

              <PackageCheck
                size={52}
                className="mx-auto text-zinc-600"
              />

              <h2 className="mt-5 text-xl font-bold">
                No Orders Yet
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Your completed and current
                orders will appear here.
              </p>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-6 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold transition-all hover:bg-orange-600 disabled:opacity-50"
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh Orders"}
              </button>

            </div>
          ) : (

            /* ================================================= */
            /* COMPACT ORDER LIST */
            /* ================================================= */

            <div className="mt-5 flex flex-col gap-3 sm:mt-7 sm:gap-4">

              {orders.map(
                (order, index) => {
                  const statusStyle =
                    getStatusStyle(
                      order.status
                    );

                  const visibleItems =
                    getVisibleItems(
                      order.items
                    );

                  const remainingItems =
                    getRemainingItemCount(
                      order.items
                    );

                  const isExpanded =
                    expandedOrder ===
                    index;

                  const isCompleted =
                    [
                      "completed",
                      "delivered",
                    ].includes(
                      (
                        order.status ||
                        ""
                      )
                        .trim()
                        .toLowerCase()
                    );

                  return (
                    <article
                      key={
                        order.order_id ||
                        `${order.token}-${index}`
                      }
                      className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-sm transition-all duration-200 hover:border-zinc-700"
                    >

                      {/* ====================================== */}
                      {/* COMPACT SUMMARY */}
                      {/* ====================================== */}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrder(
                            isExpanded
                              ? null
                              : index
                          )
                        }
                        className="w-full text-left active:scale-[0.995]"
                      >

                        <div className="p-4 sm:p-5">

                          {/* TOP */}
                          <div className="flex items-start justify-between gap-4">

                            <div className="min-w-0">

                              <div className="flex items-center gap-2">

                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full ${statusStyle.dot}`}
                                />

                                <span
                                  className={`text-sm font-semibold ${statusStyle.text}`}
                                >
                                  {
                                    statusStyle.label
                                  }
                                </span>

                              </div>

                              <p className="mt-1.5 truncate text-xs text-zinc-500">
                                {order.date ||
                                  "Date unavailable"}
                              </p>

                              <p className="mt-1 text-xs font-medium text-zinc-400">
                                {order.token
                                  ? `Token #${order.token}`
                                  : `Order #${order.order_id}`}
                              </p>

                            </div>

                            <div className="shrink-0 text-right">

                              <p className="text-lg font-bold text-white sm:text-xl">
                                ₹
                                {Number(
                                  order.total ||
                                    0
                                ).toFixed(2)}
                              </p>

                              <p className="mt-1 text-[11px] text-zinc-500">
                                {
                                  order
                                    .items
                                    .length
                                }{" "}
                                {order.items
                                  .length ===
                                1
                                  ? "item"
                                  : "items"}
                              </p>

                            </div>

                          </div>

                          {/* THUMBNAILS */}
                          {visibleItems.length >
                            0 && (
                            <div className="mt-4 flex items-center gap-2">

                              {visibleItems.map(
                                (
                                  item,
                                  itemIndex
                                ) => (
                                  <div
                                    key={`${order.order_id}-${item.name}-${itemIndex}`}
                                    className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 sm:h-14 sm:w-14"
                                  >
                                    {item.image ? (
                                      <img
                                        src={getImageUrl(
                                          item.image
                                        )}
                                        alt=""
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center text-base">
                                        🍽️
                                      </div>
                                    )}
                                  </div>
                                )
                              )}

                              {remainingItems >
                                0 && (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 sm:h-14 sm:w-14">
                                  +
                                  {
                                    remainingItems
                                  }
                                </div>
                              )}

                            </div>
                          )}

                          {/* BOTTOM */}
                          <div className="mt-4 flex items-center justify-between">

                            <span className="text-xs text-zinc-500">
                              {isExpanded
                                ? "Hide details"
                                : "View order details"}
                            </span>

                            <ChevronDown
                              size={17}
                              className={`text-orange-500 transition-transform duration-200 ${
                                isExpanded
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />

                          </div>

                        </div>

                      </button>

                      {/* ====================================== */}
                      {/* EXPANDED DETAILS */}
                      {/* ====================================== */}

                      {isExpanded && (
                        <div className="border-t border-zinc-800 bg-zinc-900/40 px-4 pb-4 pt-4 sm:px-5">

                          {/* ITEMS */}
                          <div>

                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                              Ordered Items
                            </p>

                            <div className="flex flex-col gap-3">

                              {order.items.map(
                                (
                                  item,
                                  itemIndex
                                ) => (
                                  <div
                                    key={`${item.name}-${itemIndex}`}
                                    className="flex items-center gap-3"
                                  >

                                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-800">

                                      {item.image ? (
                                        <img
                                          src={getImageUrl(
                                            item.image
                                          )}
                                          alt={
                                            item.name
                                          }
                                          loading="lazy"
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          🍽️
                                        </div>
                                      )}

                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <p className="truncate text-sm font-medium text-white">
                                        {
                                          item.name
                                        }
                                      </p>

                                      <p className="mt-0.5 text-xs text-zinc-500">
                                        Qty{" "}
                                        {
                                          item.quantity
                                        }
                                        {" • "}
                                        ₹
                                        {
                                          item.price
                                        }{" "}
                                        each
                                      </p>

                                    </div>

                                    <p className="shrink-0 text-sm font-semibold text-zinc-200">
                                      ₹
                                      {(
                                        Number(
                                          item.price
                                        ) *
                                        Number(
                                          item.quantity
                                        )
                                      ).toFixed(
                                        2
                                      )}
                                    </p>

                                  </div>
                                )
                              )}

                            </div>

                          </div>

                          {/* INFORMATION */}
                          <div className="mt-5 grid grid-cols-2 gap-2">

                            <div className="rounded-xl bg-zinc-900 p-3">
                              <p className="text-[11px] text-zinc-500">
                                Token
                              </p>

                              <p className="mt-1 text-sm font-semibold text-white">
                                #
                                {
                                  order.token
                                }
                              </p>
                            </div>

                            <div className="rounded-xl bg-zinc-900 p-3">
                              <p className="text-[11px] text-zinc-500">
                                Pickup Code
                              </p>

                              <p className="mt-1 text-sm font-semibold text-white">
                                {
                                  order.pickup_code ??
                                  "N/A"
                                }
                              </p>
                            </div>

                            {order.payment_method && (
                              <div className="rounded-xl bg-zinc-900 p-3">
                                <p className="text-[11px] text-zinc-500">
                                  Payment
                                </p>

                                <p className="mt-1 truncate text-sm font-semibold text-white">
                                  {
                                    order.payment_method
                                  }
                                </p>
                              </div>
                            )}

                            <div className="rounded-xl bg-zinc-900 p-3">
                              <p className="text-[11px] text-zinc-500">
                                Status
                              </p>

                              <p
                                className={`mt-1 truncate text-sm font-semibold ${statusStyle.text}`}
                              >
                                {
                                  statusStyle.label
                                }
                              </p>
                            </div>

                          </div>

                          {/* ACTIONS */}
                          <div className="mt-5 grid grid-cols-2 gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleReorder(
                                  order.items
                                )
                              }
                              className="rounded-xl bg-orange-500 px-3 py-3 text-sm font-bold text-white transition-all hover:bg-orange-600 active:scale-[0.98]"
                            >
                              Reorder
                            </button>

                            {isCompleted && (
                              <button
                                type="button"
                                onClick={() =>
                                  openRating(
                                    order
                                  )
                                }
                                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm font-bold text-white transition-all hover:border-orange-500 hover:text-orange-500 active:scale-[0.98]"
                              >
                                Rate Order
                              </button>
                            )}

                            {!isCompleted && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleShareOrder(
                                    order
                                  )
                                }
                                className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm font-bold text-white transition-all hover:border-orange-500 hover:text-orange-500 active:scale-[0.98]"
                              >
                                Share
                              </button>
                            )}

                          </div>

                          {/* MORE OPTIONS */}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedOrder(
                                index
                              )
                            }
                            className="mt-3 w-full rounded-xl border border-zinc-800 py-2.5 text-xs font-semibold text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                          >
                            More Order Options
                          </button>

                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </div>
      </main>

      {/* ====================================================== */}
      {/* ORDER OPTIONS MODAL */}
      {/* ====================================================== */}

      {selectedOrder !== null &&
        orders[selectedOrder] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:rounded-3xl sm:p-8">

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-bold sm:text-2xl">
                  Order Options
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrder(null)
                  }
                  className="rounded-xl p-2 transition-colors hover:bg-zinc-800"
                >
                  <X size={20} />
                </button>

              </div>

              <div className="mt-6 flex flex-col gap-3">

                <button
                  type="button"
                  onClick={() =>
                    handleDeleteOrder(
                      orders[
                        selectedOrder
                      ].order_id
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 size={20} />
                  Delete Order
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleShareOrder(
                      orders[
                        selectedOrder
                      ]
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-left text-green-400 transition-colors hover:bg-green-500/10"
                >
                  <Share2 size={20} />
                  Share Order
                </button>

              </div>

            </div>

          </div>
        )}

      {/* ====================================================== */}
      {/* RATING MODAL */}
      {/* ====================================================== */}

      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:rounded-3xl sm:p-8">

            <div className="flex items-center justify-between">

              <h2 className="text-xl font-bold sm:text-2xl">
                Rate Order
              </h2>

              <button
                type="button"
                onClick={() => {
                  setShowRatingModal(
                    false
                  );

                  setSelectedRating(0);
                  setFeedback("");
                }}
                className="rounded-xl p-2 transition-colors hover:bg-zinc-800"
              >
                <X size={20} />
              </button>

            </div>

            {/* STARS */}

            <div className="mt-7 flex justify-center gap-2">

              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setSelectedRating(
                        star
                      )
                    }
                    className="transition-transform hover:scale-110"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      size={34}
                      className={
                        star <=
                        selectedRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-500"
                      }
                    />
                  </button>
                )
              )}

            </div>

            {/* FEEDBACK */}

            <textarea
              placeholder="Write feedback..."
              value={feedback}
              onChange={(e) =>
                setFeedback(
                  e.target.value
                )
              }
              className="mt-7 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 p-4 text-sm outline-none transition-colors focus:border-orange-500"
              rows={4}
            />

            <button
              type="button"
              onClick={handleRateOrder}
              className="mt-4 w-full rounded-xl bg-orange-500 py-3.5 text-sm font-bold transition-all hover:bg-orange-600 active:scale-[0.98]"
            >
              Submit Rating
            </button>

          </div>

        </div>
      )}
    </>
  );
}