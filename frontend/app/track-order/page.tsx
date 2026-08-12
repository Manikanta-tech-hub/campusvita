"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Clock3,
  CheckCircle2,
  ChefHat,
  PackageCheck,
  QrCode,
  Home,
  Utensils,
  RefreshCw,
} from "lucide-react";
import QRCode from "react-qr-code";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "../../context/CartContext";
import { getImageUrl } from "@/app/lib/getImageUrl";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

type Order = {
  token: number;
  status: string;
  date: string;
  estimated_time: string;
  pickup_code: number;
  total: number;
  items: OrderItem[];
  email?: string;
};

const statusSteps = [
  { key: "Preparing", label: "Preparing", icon: ChefHat },
  { key: "Cooking", label: "Cooking", icon: Utensils },
  { key: "Ready For Pickup", label: "Ready for Pickup", icon: PackageCheck },
  { key: "Completed", label: "Completed", icon: CheckCircle2 },
];

const statusColors: Record<string, string> = {
  Preparing: "text-yellow-400 bg-yellow-500/20 border-yellow-500/50",
  Cooking: "text-blue-400 bg-blue-500/20 border-blue-500/50",
  "Ready For Pickup": "text-purple-400 bg-purple-500/20 border-purple-500/50",
  Completed: "text-green-400 bg-green-500/20 border-green-500/50",
};

const statusMessages: Record<string, string> = {
  Preparing: "👨‍🍳 Our chefs are preparing your food...",
  Cooking: "🔥 Your food is being cooked to perfection...",
  "Ready For Pickup": "🎉 Your order is ready for pickup!",
  Completed: "✅ Order completed. Thank you for ordering!",
};

export default function TrackOrderPage() {
  const router = useRouter();
  const { cartItems } = useCart();
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousStatus, setPreviousStatus] = useState("");
  const [fetchCompleted, setFetchCompleted] = useState(false);
  const [highlightedStatus, setHighlightedStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestOrderRef = useRef<Order | null>(null);

  // ✅ FIX 1: Keep ref synchronized with state
  useEffect(() => {
    latestOrderRef.current = latestOrder;
  }, [latestOrder]);

  // =====================================
  // NOTIFICATION PERMISSION
  // =====================================
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission !== "granted"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // =====================================
  // FETCH LATEST ORDER
  // =====================================
  const fetchLatestOrder = async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);

      const token = localStorage.getItem("access_token");
      if (!token) {
        setFetchCompleted(true);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      const response = await fetch(`${API_URL}/orders`, {

        headers: {
      
          Authorization: `Bearer ${token}`,
      
        },
      
      });
      const data = await response.json();

      if (response.ok && data.orders?.length > 0) {
        const latest = data.orders[data.orders.length - 1];

        // ✅ FIX 3: Only update if order actually changed
        const current = latestOrderRef.current;
        if (current && latest.status !== current.status) {
          setHighlightedStatus(latest.status);
          if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
          statusTimeoutRef.current = setTimeout(() => {
            setHighlightedStatus(null);
          }, 3000);
        }

        if (JSON.stringify(current) !== JSON.stringify(latest)) {
          setLatestOrder(latest);
          latestOrderRef.current = latest;
          setPreviousStatus(latest.status);
          localStorage.setItem("latestOrder", JSON.stringify(latest));
        }
      }
    } catch (error) {
      console.error(error);
      if (!showRefresh) toast.error("Failed To Load Order");
    } finally {
      setFetchCompleted(true);
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // =====================================
  // SOCKET CONNECTION
  // =====================================
  useEffect(() => {
    // ✅ FIX 7: Check if cached order belongs to the logged-in user
    const email = localStorage.getItem("userEmail");
    const cached = localStorage.getItem("latestOrder");
    if (cached && email) {
      try {
        const order = JSON.parse(cached);
        if (order.email === email) {
          setLatestOrder(order);
          latestOrderRef.current = order;
          setPreviousStatus(order.status);
          setLoading(false);
        }
      } catch (e) {
        console.error("Error parsing cached order:", e);
      }
    }

    // ✅ Background refresh
    fetchLatestOrder();

    // ✅ Socket connection
    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket Connected 🚀");
    });

    socket.on("order_update", (updatedOrder: Order) => {
      const userEmail = localStorage.getItem("userEmail");
      if (updatedOrder.email && updatedOrder.email !== userEmail) {
        return;
      }

      // ✅ Highlight the updated status card
      const current = latestOrderRef.current;
      if (current && updatedOrder.status !== current.status) {
        setHighlightedStatus(updatedOrder.status);
        if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
        statusTimeoutRef.current = setTimeout(() => {
          setHighlightedStatus(null);
        }, 3000);
      }

      setLatestOrder(updatedOrder);
      latestOrderRef.current = updatedOrder;
      localStorage.setItem("latestOrder", JSON.stringify(updatedOrder));

      setPreviousStatus((prevStatus) => {
        if (prevStatus && prevStatus !== updatedOrder.status) {
          toast.success(`Order ${updatedOrder.status} 🚀`);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("CampusVita 🚀", {
              body: `Your order is now ${updatedOrder.status}`,
            });
          }
        }
        return updatedOrder.status;
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket Disconnected");
    });

    return () => {
      // ✅ FIX 4: Clean up socket properly
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const currentStep = latestOrder
    ? statusSteps.findIndex((s) => s.key === latestOrder.status)
    : 0;

  // =====================================
  // SKELETON LOADING
  // =====================================
  if (loading && !latestOrder) {
    return (
      <>
        <Navbar/>
        <main className="min-h-screen bg-black p-6 md:p-10">
          <div className="max-w-6xl mx-auto animate-pulse space-y-6">
            <div className="h-32 rounded-3xl bg-zinc-900 border border-zinc-800" />
            <div className="h-48 rounded-3xl bg-zinc-900 border border-zinc-800" />
            <div className="h-64 rounded-3xl bg-zinc-900 border border-zinc-800" />
            <div className="h-72 rounded-3xl bg-zinc-900 border border-zinc-800" />
          </div>
        </main>
      </>
    );
  }

  // =====================================
  // NO ORDER
  // =====================================
  if (!latestOrder && fetchCompleted) {
    return (
      <>
        <Navbar/>
        <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center max-w-2xl w-full">
            <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home size={48} className="text-orange-500" />
            </div>
            <h1 className="text-4xl font-bold text-orange-500">No Active Orders</h1>
            <p className="text-gray-400 mt-4 text-lg">
              Place an order to track it in real-time 🚀
            </p>
            <button
              onClick={() => router.push("/menu")}
              className="mt-6 bg-orange-500 px-8 py-3 rounded-2xl hover:bg-orange-600 transition-all font-bold"
            >
              Browse Menu
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!latestOrder) {
    return null;
  }

  const currentStatusColor = statusColors[latestOrder.status] || "text-gray-400 bg-zinc-800";

  // =====================================
  // MAIN UI WITH ANIMATIONS
  // =====================================
  return (
    <>
    
    <Navbar/>
      <main className="min-h-screen bg-black text-white p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            {/* HEADER */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-orange-500">
                    Track Order
                  </h1>
                  <p className="text-gray-400 mt-2 text-lg">
                    Real-time tracking for your order
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-6 py-3 rounded-2xl border font-bold text-lg transition-all duration-500 ${currentStatusColor}`}>
                    {latestOrder.status}
                  </span>
                  {/* ✅ FIX 5: Disable during loading too */}
                  <button
                    onClick={() => fetchLatestOrder(true)}
                    disabled={isRefreshing || loading}
                    aria-label="Refresh order status"
                    className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={20} className={`${isRefreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* ORDER CARD */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-6">
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <PackageCheck className="text-orange-500" size={40} />
                    <div>
                      <h2 className="text-3xl font-bold">Token #{latestOrder.token}</h2>
                      <p className="text-gray-400 text-sm mt-1">
                        Order placed on {latestOrder.date}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <div className="flex items-center gap-3 text-gray-300 bg-zinc-800/50 p-4 rounded-2xl">
                      <Clock3 size={20} className="text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-400">Estimated Time</p>
                        <p className="font-medium">{latestOrder.estimated_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 bg-zinc-800/50 p-4 rounded-2xl">
                      <QrCode size={20} className="text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-400">Pickup Code</p>
                        <p className="font-mono font-bold text-2xl text-orange-500 animate-pulse">
                          {latestOrder.pickup_code}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 bg-white p-4 rounded-2xl self-center lg:self-auto transition-transform duration-300 hover:scale-105 shadow-lg">
                  <QRCode
                    value={JSON.stringify({
                      token: latestOrder.token,
                      pickup_code: latestOrder.pickup_code,
                    })}
                    size={160}
                  />
                </div>
              </div>
            </div>

            {/* STATUS TIMELINE WITH PROGRESS BAR */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-6">
              <h2 className="text-2xl font-bold mb-6">Order Status</h2>
              <div className="relative">
                <div className="hidden md:block absolute left-8 top-8 bottom-8 w-1 bg-zinc-800">
                  <div
                    className="w-full bg-orange-500 transition-all duration-700 ease-in-out"
                    style={{
                      height: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {statusSteps.map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCurrent = index === currentStep;
                    const isHighlighted = highlightedStatus === step.key;
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.key}
                        className={`
                          relative flex items-start md:flex-col md:items-center gap-4 p-4 rounded-2xl 
                          transition-all duration-500 transform
                          ${isActive 
                            ? `bg-orange-500/10 border border-orange-500/30 ${isHighlighted ? "animate-pulse" : ""}` 
                            : "bg-zinc-800/50 border border-zinc-800"
                          }
                          ${isCurrent ? "scale-105" : "scale-100"}
                        `}
                      >
                        <div
                          className={`
                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                            transition-all duration-500
                            ${isActive
                              ? "bg-orange-500 text-white"
                              : "bg-zinc-700 text-gray-400"
                            }
                            ${isHighlighted ? "animate-bounce" : ""}
                          `}
                        >
                          {isActive ? (
                            <CheckCircle2 size={20} />
                          ) : (
                            <Icon size={20} />
                          )}
                        </div>
                        <div>
                          <p className={`font-medium ${isActive ? "text-white" : "text-gray-400"}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-orange-400 mt-1 animate-pulse">
                              In Progress...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl text-center transition-all duration-500">
                <p className="text-orange-400 font-medium">
                  {statusMessages[latestOrder.status] || "Processing your order..."}
                </p>
              </div>
            </div>

            {/* ORDER ITEMS */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-2xl font-bold">Order Items</h2>
                <h2 className="text-3xl font-bold text-orange-500">₹{latestOrder.total}</h2>
              </div>
              <div className="mt-6 space-y-3">
                {latestOrder.items.map((item, index) => (
                  // ✅ FIX 2: Better React key
                  <div
                    key={`${item.name}-${item.quantity}-${item.price}-${index}`}
                    className="bg-zinc-800/50 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {item.image && (
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-orange-500">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* COMPLETED BANNER */}
            {latestOrder.status === "Completed" && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-3xl p-6 text-center transition-all duration-500 animate-in fade-in">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 size={28} className="text-green-400" />
                  <span className="text-xl font-bold text-green-400">
                    Order Completed Successfully ✅
                  </span>
                </div>
                <p className="text-gray-400 mt-2 text-sm">
                  Thank you for ordering with CampusVita. We hope you enjoyed your meal!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}