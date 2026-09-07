"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/app/lib/auth/session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type VendorItem = {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stall_id?: string;
};

type StallOrder = {
  stall_id: string;
  status: string;
  estimatedPreparationMinutes: number;
  cookingStartedAt?: string | null;
  readyAt?: string | null;
};

type VendorOrder = {
  order_id: string;
  token?: number;
  name?: string;
  total: number;
  status: string;
  created_at?: string;
  items: VendorItem[];
  stall_orders: StallOrder[];
};

export default function VendorDashboardPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    try {
      setError("");

      const token = getAccessToken("VENDOR");

      if (!token) {
        throw new Error("Vendor session expired. Please log in again.");
      }

      const response = await fetch(`${API_URL}/vendor/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load vendor orders.");
      }

      setOrders(data.orders || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load vendor orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    const interval = setInterval(loadOrders, 5000);

    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (
    order: VendorOrder,
    stallOrder: StallOrder,
    nextStatus: string
  ) => {
    try {
      const token = getAccessToken("VENDOR");

      if (!token) {
        throw new Error("Vendor session expired.");
      }

      const response = await fetch(
        `${API_URL}/vendor/orders/${order.token}/status?stall_id=${encodeURIComponent(
          stallOrder.stall_id
        )}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update order status."
        );
      }

      await loadOrders();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );
    }
  };

  const getNextAction = (status: string) => {
    switch (status) {
      case "Pending":
        return {
          label: "Accept Order",
          next: "Accepted",
        };

      case "Accepted":
        return {
          label: "Place Order",
          next: "Placed",
        };

      case "Placed":
        return {
          label: "Start Cooking",
          next: "Cooking",
        };

      case "Cooking":
        return {
          label: "Mark Ready",
          next: "Ready For Pickup",
        };

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b0b0b] px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <p className="mt-3 text-gray-400">
            Loading your stall orders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-orange-400">
            CAMPUSVITA VENDOR
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Vendor Dashboard
          </h1>

          <p className="mt-2 text-gray-400">
            Manage orders from your assigned stalls.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <h2 className="text-xl font-semibold">
              No orders yet
            </h2>

            <p className="mt-2 text-gray-400">
              Orders containing items from your stalls will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <section
                key={order.order_id}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl"
              >
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">
                      Order #{order.token ?? order.order_id}
                    </p>

                    <h2 className="mt-1 text-xl font-semibold">
                      {order.name || "Customer"}
                    </h2>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-sm text-gray-400">
                      Vendor Total
                    </p>

                    <p className="text-xl font-bold text-orange-400">
                      ₹{order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {order.stall_orders.map((stallOrder) => {
                    const action = getNextAction(stallOrder.status);

                    const stallItems = order.items.filter(
                      (item) =>
                        String(item.stall_id) ===
                        String(stallOrder.stall_id)
                    );

                    return (
                      <div
                        key={stallOrder.stall_id}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4"
                      >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500">
                              Stall
                            </p>

                            <p className="mt-1 font-medium">
                              {stallOrder.stall_id}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${
                              stallOrder.status === "Ready For Pickup"
                                ? "bg-green-500/15 text-green-400"
                                : stallOrder.status === "Cooking"
                                  ? "bg-orange-500/15 text-orange-400"
                                  : "bg-white/10 text-gray-300"
                            }`}
                          >
                            {stallOrder.status}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {stallItems.map((item, index) => (
                            <div
                              key={`${item.name}-${index}`}
                              className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] p-3"
                            >
                              <div>
                                <p className="font-medium">
                                  {item.name}
                                </p>

                                <p className="text-sm text-gray-400">
                                  Qty: {item.quantity}
                                </p>
                              </div>

                              <p className="font-medium">
                                ₹
                                {(
                                  Number(item.price) *
                                  Number(item.quantity)
                                ).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {action && (
                          <button
                            type="button"
                            onClick={() =>
                              updateStatus(
                                order,
                                stallOrder,
                                action.next
                              )
                            }
                            className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-black transition hover:bg-orange-400"
                          >
                            {action.label}
                          </button>
                        )}

                        {stallOrder.status === "Ready For Pickup" && (
                          <div className="mt-4 rounded-xl bg-green-500/10 px-4 py-3 text-center text-sm font-medium text-green-400">
                            Ready for customer pickup
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}