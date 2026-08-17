"use client";

import toast from "react-hot-toast";
import { useCallback, useEffect, useState } from "react";

import {
  MoreVertical,
  Trash2,
  Share2,
  X,
  Star,
  PackageCheck,
  Clock3,
  RefreshCw,
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

const API_URL = "http://127.0.0.1:8000";

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

  const [selectedOrder, setSelectedOrder] =
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
  //
  // IMPORTANT:
  // Backend endpoint is:
  //
  // GET /orders
  //
  // NOT:
  //
  // GET /orders/{email}
  //
  // The backend gets the email from the JWT token.
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
        // HANDLE AUTH ERRORS
        // ======================================================

        if (response.status === 401) {
          toast.error(
            "Your session has expired. Please login again."
          );

          setOrders([]);
          return;
        }

        // ======================================================
        // HANDLE OTHER API ERRORS
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

      const data = await response.json();

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
  // STATUS COLOR
  // ============================================================

  const getStatusColor = (
    status: string
  ) => {
    switch (status) {
      case "Preparing":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500";

      case "Cooking":
        return "bg-orange-500/20 text-orange-400 border-orange-500";

      case "Ready For Pickup":
        return "bg-blue-500/20 text-blue-400 border-blue-500";

      case "Completed":
        return "bg-green-500/20 text-green-400 border-green-500";

      default:
        return "bg-zinc-700 text-white border-zinc-700";
    }
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = () => {
    fetchOrders(true);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white p-6 md:p-10">
        <div className="max-w-6xl mx-auto">

          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div>
              <h1 className="text-5xl font-bold text-orange-500">
                Order History
              </h1>

              <p className="text-gray-400 mt-3 text-lg">
                Track all your orders 🚀
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 hover:border-orange-500 px-6 py-4 rounded-2xl transition-all disabled:opacity-50"
            >
              <RefreshCw
                size={20}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh Orders"}
            </button>

          </div>

          {/* ================================================== */}
          {/* LOADING */}
          {/* ================================================== */}

          {loading ? (
            <div className="mt-20 bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">

              <RefreshCw
                size={42}
                className="mx-auto text-orange-500 animate-spin"
              />

              <p className="text-xl text-gray-400 mt-6">
                Loading your orders...
              </p>

            </div>
          ) : orders.length === 0 ? (

            /* ================================================= */
            /* EMPTY STATE */
            /* ================================================= */

            <div className="bg-zinc-900 p-10 md:p-16 rounded-3xl mt-10 text-center border border-zinc-800">

              <PackageCheck
                size={70}
                className="mx-auto text-gray-500"
              />

              <h2 className="text-3xl font-bold mt-8">
                No Orders Yet 🍔
              </h2>

              <p className="text-gray-400 mt-4 text-lg">
                Your completed and current
                orders will appear here.
              </p>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-8 bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-2xl font-bold transition-all disabled:opacity-50"
              >
                {refreshing
                  ? "Refreshing..."
                  : "Refresh Orders"}
              </button>

            </div>
          ) : (

            /* ================================================= */
            /* ORDERS */
            /* ================================================= */

            <div className="mt-10 flex flex-col gap-8">

              {orders.map(
                (order, index) => (

                  <div
                    key={
                      order.order_id ||
                      `${order.token}-${index}`
                    }
                    className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 md:p-8"
                  >

                    {/* ======================================== */}
                    {/* HEADER */}
                    {/* ======================================== */}

                    <div className="flex flex-col lg:flex-row justify-between gap-6">

                      <div>

                        <div className="flex items-center gap-3">

                          <PackageCheck
                            className="text-orange-500"
                            size={28}
                          />

                          <h2 className="text-3xl md:text-4xl font-bold">
                            Token #{order.token}
                          </h2>

                        </div>

                        <div className="mt-4 flex flex-col gap-2 text-gray-400">

                          <p className="flex items-center gap-2">

                            <Clock3 size={18} />

                            {order.date ||
                              "Date unavailable"}

                          </p>

                          <p>
                            Pickup Code:{" "}
                            <span className="text-green-400 font-bold">
                              {order.pickup_code ||
                                "N/A"}
                            </span>
                          </p>

                          <p>
                            ETA:{" "}
                            {order.estimated_time ||
                              "15-20 mins"}
                          </p>

                          {order.payment_method && (
                            <p>
                              Payment:{" "}
                              <span className="text-white">
                                {order.payment_method}
                              </span>
                            </p>
                          )}

                        </div>

                      </div>

                      <div className="flex items-center gap-4">

                        <div
                          className={`px-5 py-3 rounded-2xl border font-bold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </div>

                        <button
                          onClick={() =>
                            setSelectedOrder(
                              index
                            )
                          }
                          className="p-3 rounded-xl hover:bg-zinc-800 transition-all"
                          aria-label="Order options"
                        >
                          <MoreVertical />
                        </button>

                      </div>

                    </div>

                    {/* ======================================== */}
                    {/* ITEMS */}
                    {/* ======================================== */}

                    <div className="mt-8 flex flex-col gap-5">

                      {order.items?.map(
                        (item, itemIndex) => (

                          <div
                            key={`${item.name}-${itemIndex}`}
                            className="bg-zinc-800 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
                          >

                            <div className="flex items-center gap-5">

                              <img
                                src={getImageUrl(
                                  item.image || ""
                                )}
                                alt={item.name}
                                className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-2xl"
                              />

                              <div>

                                <h3 className="text-xl md:text-2xl font-bold">
                                  {item.name}
                                </h3>

                                <p className="text-gray-400 mt-1">
                                  Quantity:{" "}
                                  {item.quantity}
                                </p>

                                <p className="text-gray-500 mt-1">
                                  ₹{item.price} each
                                </p>

                              </div>

                            </div>

                            <h3 className="text-2xl font-bold text-orange-500">
                              ₹
                              {(
                                Number(
                                  item.price
                                ) *
                                Number(
                                  item.quantity
                                )
                              ).toFixed(2)}
                            </h3>

                          </div>

                        )
                      )}

                    </div>

                    {/* ======================================== */}
                    {/* FOOTER */}
                    {/* ======================================== */}

                    <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-5">

                      <h2 className="text-3xl md:text-4xl font-bold text-orange-500">
                        ₹
                        {Number(
                          order.total || 0
                        ).toFixed(2)}
                      </h2>

                      <div className="flex gap-4 flex-wrap justify-center">

                        <button
                          onClick={() =>
                            handleReorder(
                              order.items
                            )
                          }
                          className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-2xl transition-all font-semibold"
                        >
                          Reorder
                        </button>

                        <button
                          onClick={() => {
                            setShowRatingModal(
                              true
                            );

                            setSelectedFoodName(
                              order.items?.[0]
                                ?.name || ""
                            );
                          }}
                          className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded-2xl transition-all font-semibold"
                        >
                          Rate Order
                        </button>

                      </div>

                    </div>

                  </div>
                )
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

          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

            <div className="bg-zinc-900 p-8 rounded-3xl w-full max-w-md border border-zinc-800">

              <div className="flex justify-between items-center">

                <h2 className="text-3xl font-bold">
                  Order Options
                </h2>

                <button
                  onClick={() =>
                    setSelectedOrder(null)
                  }
                  className="p-2 hover:bg-zinc-800 rounded-xl"
                >
                  <X />
                </button>

              </div>

              <div className="mt-8 flex flex-col gap-6">

                <button
                  onClick={() =>
                    handleDeleteOrder(
                      orders[
                        selectedOrder
                      ].order_id
                    )
                  }
                  className="flex items-center gap-4 text-red-400 text-xl hover:text-red-300 transition-all"
                >
                  <Trash2 />
                  Delete Order
                </button>

                <button
                  onClick={() =>
                    handleShareOrder(
                      orders[
                        selectedOrder
                      ]
                    )
                  }
                  className="flex items-center gap-4 text-green-400 text-xl hover:text-green-300 transition-all"
                >
                  <Share2 />
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

        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">

          <div className="bg-zinc-900 p-8 rounded-3xl w-full max-w-md border border-zinc-800">

            <div className="flex justify-between items-center">

              <h2 className="text-3xl font-bold">
                Rate Order
              </h2>

              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setSelectedRating(0);
                  setFeedback("");
                }}
                className="p-2 hover:bg-zinc-800 rounded-xl"
              >
                <X />
              </button>

            </div>

            {/* ============================================== */}
            {/* STARS */}
            {/* ============================================== */}

            <div className="flex justify-center gap-3 mt-8">

              {[1, 2, 3, 4, 5].map(
                (star) => (

                  <button
                    key={star}
                    onClick={() =>
                      setSelectedRating(
                        star
                      )
                    }
                    className="transition-transform hover:scale-110"
                    aria-label={`Rate ${star} stars`}
                  >

                    <Star
                      size={40}
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

            {/* ============================================== */}
            {/* FEEDBACK */}
            {/* ============================================== */}

            <textarea
              placeholder="Write Feedback..."
              value={feedback}
              onChange={(e) =>
                setFeedback(
                  e.target.value
                )
              }
              className="w-full mt-8 p-4 rounded-2xl bg-zinc-800 outline-none border border-zinc-700 focus:border-orange-500 resize-none"
              rows={4}
            />

            <button
              onClick={handleRateOrder}
              className="w-full bg-orange-500 py-4 rounded-2xl mt-6 hover:bg-orange-600 transition-all font-bold"
            >
              Submit Rating
            </button>

          </div>

        </div>
      )}
    </>
  );
}