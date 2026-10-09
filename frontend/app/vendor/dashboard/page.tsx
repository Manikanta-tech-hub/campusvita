"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock3,
  CookingPot,
  LogOut,
  Moon,
  PackageCheck,
  RefreshCw,
  Store,
  Sun,
  TimerReset,
  UserRound,
  XCircle,
} from "lucide-react";
import VendorSidebar from "@/components/vendor/vendor-sidebar";

import {
  clearSession,
  getAccessToken,
} from "@/app/lib/auth/session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type VendorItem = {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stall_id?: string;
  cancelled?: boolean;
  cancellationReason?: string | null;
};

type StallOrder = {
  stall_id: string;
  status: string;
  estimatedPreparationMinutes: number;
  cookingStartedAt?: string | null;
  readyAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
};

type VendorOrder = {
  order_id: string;
  token?: number;
  name?: string;
  total: number;
  status: string;
  created_at?: string;
  cancelled?: boolean;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  items: VendorItem[];
  stall_orders: StallOrder[];
};

type VendorOrdersResponse = {
  success: boolean;
  orders: VendorOrder[];
  today_revenue?: number;
};

type Action = {
  label: string;
  next: string;
};

const STATUS_ORDER = [
  "Pending",
  "Accepted",
  "Placed",
  "Cooking",
  "Ready For Pickup",
];

function formatMoney(value: number) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function getImageUrl(image?: string) {
  if (!image) return "";

  if (
    image.startsWith("http://") ||
    image.startsWith("https://") ||
    image.startsWith("data:")
  ) {
    return image;
  }

  return `${API_URL}${image.startsWith("/") ? image : `/${image}`}`;
}

function getNextAction(status: string): Action | null {
  switch (status) {
    case "Pending":
      return { label: "Accept Order", next: "Accepted" };

    case "Accepted":
      return { label: "Place Order", next: "Placed" };

    case "Placed":
      return { label: "Start Cooking", next: "Cooking" };

    case "Cooking":
      return { label: "Mark Ready", next: "Ready For Pickup" };

    default:
      return null;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "Pending":
      return "New Order";
    case "Accepted":
      return "Accepted";
    case "Placed":
      return "Placed";
    case "Cooking":
      return "Preparing";
    case "Ready For Pickup":
      return "Ready";
    case "Cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "Pending":
      return Clock3;
    case "Accepted":
      return Check;
    case "Placed":
      return PackageCheck;
    case "Cooking":
      return CookingPot;
    case "Ready For Pickup":
      return Check;
    case "Cancelled":
      return XCircle;
    default:
      return Clock3;
  }
}

function getStatusStyles(status: string) {
  switch (status) {
    case "Pending":
      return {
        badge:
          "border-brand/20 bg-brand/10 text-brand-hover",
        badgeDark:
          "dark:text-brand",
        dot:
          "bg-brand",
        dotDark:
          "dark:bg-brand",
      };

    case "Accepted":
      return {
        badge:
          "border-blue-400/20 bg-blue-500/10 text-blue-600",
        badgeDark:
          "dark:text-blue-300",
        dot:
          "bg-blue-500",
        dotDark:
          "dark:bg-blue-400",
      };

    case "Placed":
      return {
        badge:
          "border-violet-400/20 bg-violet-500/10 text-violet-600",
        badgeDark:
          "dark:text-violet-300",
        dot:
          "bg-violet-500",
        dotDark:
          "dark:bg-violet-400",
      };

    case "Cooking":
      return {
        badge:
          "border-brand/20 bg-brand/10 text-brand-hover",
        badgeDark:
          "dark:text-brand",
        dot:
          "bg-brand",
        dotDark:
          "dark:bg-brand",
      };

    case "Ready For Pickup":
      return {
        badge:
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-600",
        badgeDark:
          "dark:text-emerald-300",
        dot:
          "bg-emerald-500",
        dotDark:
          "dark:bg-emerald-400",
      };

    case "Cancelled":
      return {
        badge:
          "border-red-400/20 bg-red-500/10 text-red-600",
        badgeDark:
          "dark:text-red-300",
        dot:
          "bg-red-500",
        dotDark:
          "dark:bg-red-400",
      };

    default:
      return {
        badge:
          "border-black/10 bg-black/5 text-[var(--text-muted)]",
        badgeDark:
          "dark:border-white/10 dark:bg-white/5 dark:text-white/60",
        dot:
          "bg-black/30",
        dotDark:
          "dark:bg-white/40",
      };
  }
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRemainingSeconds(
  cookingStartedAt?: string | null,
  preparationMinutes?: number
) {
  if (!cookingStartedAt || !preparationMinutes) {
    return null;
  }

  const started = new Date(cookingStartedAt).getTime();

  if (Number.isNaN(started)) {
    return null;
  }

  const totalSeconds = Number(preparationMinutes) * 60;

  const elapsedSeconds = Math.floor(
    (Date.now() - started) / 1000
  );

  return Math.max(0, totalSeconds - elapsedSeconds);
}

function formatCountdown(seconds: number | null) {
  if (seconds === null) {
    return "--:--";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

function getProgress(status: string) {
  const index = STATUS_ORDER.indexOf(status);

  if (index === -1) {
    return 0;
  }

  return ((index + 1) / STATUS_ORDER.length) * 100;
}

export default function VendorDashboardPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [cancellingKey, setCancellingKey] = useState<string | null>(null);

  const [, setTimerTick] = useState(0);

  // ============================================================
  // THEME
  // ============================================================

  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    let dark = true;

    if (savedTheme === "light") {
      dark = false;
    } else if (savedTheme === "dark") {
      dark = true;
    } else {
      dark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
    }

    setIsDark(dark);

    document.documentElement.classList.toggle("dark", dark);

    document.documentElement.style.colorScheme = dark
      ? "dark"
      : "light";

    document.body.style.backgroundColor = dark
      ? "#303746"
      : "#e6e7eb";
  }, []);

  const toggleTheme = () => {
    setIsDark((current) => {
      const next = !current;

      localStorage.setItem(
        "theme",
        next ? "dark" : "light"
      );

      document.documentElement.classList.toggle(
        "dark",
        next
      );

      document.documentElement.style.colorScheme = next
        ? "dark"
        : "light";

      document.body.style.backgroundColor = next
        ? "#303746"
        : "#e6e7eb";

      return next;
    });
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    clearSession("VENDOR");
    window.location.href = "/login";
  };

  // ============================================================
  // LOAD ORDERS
  // ============================================================

  const loadOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      setError("");

      const token = getAccessToken("VENDOR");

      if (!token) {
        throw new Error(
          "Vendor session expired. Please log in again."
        );
      }

      const response = await fetch(
        `${API_URL}/vendor/orders`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data: VendorOrdersResponse =
        await response.json();

      if (!response.ok) {
        throw new Error(
          (data as unknown as { detail?: string }).detail ||
            "Failed to load vendor orders."
        );
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );

      setTodayRevenue(
        Number(data.today_revenue || 0)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load vendor orders."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // INITIAL LOAD + LIVE POLLING
  // ============================================================

  useEffect(() => {
    loadOrders();

    const interval = setInterval(() => {
      loadOrders();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // TIMER
  // ============================================================

  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick((value) => value + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ============================================================
  // STATISTICS
  // ============================================================

  const statistics = useMemo(() => {
    let pending = 0;
    let cooking = 0;
    let ready = 0;
    let cancelled = 0;

    orders.forEach((order) => {
      if (
        order.cancelled ||
        order.status === "Cancelled"
      ) {
        cancelled += 1;
        return;
      }

      order.stall_orders.forEach((stallOrder) => {
        if (stallOrder.status === "Pending") {
          pending += 1;
        }

        if (stallOrder.status === "Cooking") {
          cooking += 1;
        }

        if (
          stallOrder.status ===
          "Ready For Pickup"
        ) {
          ready += 1;
        }
      });
    });

    return {
      total: orders.length,
      pending,
      cooking,
      ready,
      cancelled,
    };
  }, [orders]);

  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const updateStatus = async (
    order: VendorOrder,
    stallOrder: StallOrder,
    nextStatus: string
  ) => {
    const updateKey = `${order.order_id}-${stallOrder.stall_id}`;

    try {
      setUpdatingKey(updateKey);
      setError("");

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
          data.detail ||
            "Unable to update order status."
        );
      }

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingKey(null);
    }
  };

  // ============================================================
  // CANCEL STALL ORDER
  // ============================================================

  const cancelCompleteOrder = async (
    order: VendorOrder,
    stallOrder: StallOrder
  ) => {
    const orderNumber =
      order.token ?? order.order_id;

    const confirmed = window.confirm(
      `Cancel this stall order from Order #${orderNumber}?\n\nOnly this stall's items will be cancelled. Items from other stalls will remain active.`
    );

    if (!confirmed) {
      return;
    }

    const key = `order-${order.order_id}-${stallOrder.stall_id}`;

    try {
      setCancellingKey(key);
      setError("");

      const token = getAccessToken("VENDOR");

      if (!token) {
        throw new Error("Vendor session expired.");
      }

      const response = await fetch(
        `${API_URL}/vendor/orders/${order.token}/cancel?stall_id=${encodeURIComponent(
          stallOrder.stall_id
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason:
              "Stall order cancelled by vendor",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to cancel stall order."
        );
      }

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel stall order."
      );
    } finally {
      setCancellingKey(null);
    }
  };

  // ============================================================
  // CANCEL ITEM
  // ============================================================

  const cancelItem = async (
    order: VendorOrder,
    stallOrder: StallOrder,
    itemIndex: number,
    item: VendorItem
  ) => {
    const confirmed = window.confirm(
      `Cancel "${item.name}" from Order #${
        order.token ?? order.order_id
      }?\n\nOnly this item will be cancelled.`
    );

    if (!confirmed) {
      return;
    }

    const key = `item-${order.order_id}-${stallOrder.stall_id}-${itemIndex}`;

    try {
      setCancellingKey(key);
      setError("");

      const token = getAccessToken("VENDOR");

      if (!token) {
        throw new Error("Vendor session expired.");
      }

      const response = await fetch(
        `${API_URL}/vendor/orders/${order.token}/items/cancel?stall_id=${encodeURIComponent(
          stallOrder.stall_id
        )}&item_index=${itemIndex}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason:
              "Item cancelled by vendor",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to cancel item."
        );
      }

      await loadOrders();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel item."
      );
    } finally {
      setCancellingKey(null);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <VendorSidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          onLogout={handleLogout}
        />
        <main
        className={`min-w-0 flex-1 min-h-screen transition-colors duration-300 ${
          isDark
            ? "bg-[var(--background)] text-white"
            : "bg-[var(--background)] text-[var(--text-primary)]"
        }`}
      >
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div
              className={`h-8 w-40 rounded-lg ${
                isDark ? "bg-[var(--surface)]" : "bg-slate-200"
              }`}
            />

            <div
              className={`mt-3 h-4 w-64 rounded ${
                isDark ? "bg-[var(--surface)]" : "bg-slate-100"
              }`}
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={`h-28 rounded-2xl ${
                    isDark
                      ? "border border-white/[0.05] bg-[var(--surface)]"
                      : "border border-slate-200 bg-card"
                  }`}
                />
              ))}
            </div>

            <div
              className={`mt-8 h-72 rounded-3xl ${
                isDark
                  ? "border border-white/[0.05] bg-[var(--surface)]"
                  : "border border-slate-200 bg-card"
              }`}
            />
          </div>
        </div>
      </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <VendorSidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        onLogout={handleLogout}
      />
      <main
      className={`min-w-0 flex-1 min-h-screen transition-colors duration-300 ${
        isDark
          ? "bg-[var(--background)] text-white"
          : "bg-[var(--background)] text-[var(--text-primary)]"
      }`}
    >
      {/* HEADER */}

      <header
        className={`sticky top-0 z-40 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDark
            ? "border-white/[0.07] bg-navbar"
            : "border-[var(--border)] bg-navbar"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/20">
              <Store className="h-5 w-5 text-[var(--on-primary)]" />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand dark:text-brand">
                CampusVita
              </p>

              <h1 className="text-base font-bold tracking-tight">
                Vendor Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isDark
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              title={
                isDark
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              className={`group flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                isDark
                  ? "border-white/10 bg-white/[0.04] text-white/70 hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                  : "border-black/10 bg-black/[0.03] text-slate-600 hover:border-brand/30 hover:bg-brand/10 hover:text-brand-hover"
              }`}
            >
              {isDark ? (
                <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
              ) : (
                <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
              )}
            </button>

            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={refreshing}
              aria-label="Refresh orders"
              title="Refresh orders"
              className={`group flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isDark
                  ? "border-white/10 bg-white/[0.04] text-white/70 hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
                  : "border-black/10 bg-black/[0.03] text-slate-600 hover:border-brand/30 hover:bg-brand/10 hover:text-brand-hover"
              }`}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                isDark
                  ? "border-white/10 bg-white/[0.04] text-white/55 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                  : "border-black/10 bg-black/[0.03] text-slate-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600"
              }`}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* HERO */}

        <section
          className={`relative overflow-hidden rounded-[28px] border p-5 shadow-2xl transition-colors duration-300 sm:p-7 lg:p-8 ${
            isDark
              ? "border-brand/10 bg-gradient-to-br from-[rgba(104,110,232,0.22)] via-[rgba(104,110,232,0.10)] to-[var(--surface)] shadow-black/20"
              : "border-brand/10 bg-gradient-to-br from-brand-soft via-white to-slate-100 shadow-black/5"
          }`}
        >
          <div className="absolute -right-20 -top-32 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />

          <div className="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-brand/[0.06] blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand-hover dark:text-brand">
                <span className="h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_10px_rgba(134,145,240,0.75)] dark:bg-brand" />
                LIVE VENDOR DASHBOARD
              </div>

              <h2
                className={`text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl ${
                  isDark
                    ? "text-white"
                    : "text-slate-950"
                }`}
              >
                My Stall
              </h2>

              <p
                className={`mt-3 max-w-xl text-sm leading-6 sm:text-base ${
                  isDark
                    ? "text-white/45"
                    : "text-slate-600"
                }`}
              >
                Manage incoming orders, prepare food, and keep
                customers updated in real time.
              </p>
            </div>

            <div
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur-sm ${
                isDark
                  ? "border-white/10 bg-[var(--surface)]/90"
                  : "border-[var(--border)] bg-card/90"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">
                <Store className="h-5 w-5 text-brand dark:text-brand" />
              </div>

              <div>
                <p
                  className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                    isDark
                      ? "text-white/35"
                      : "text-slate-500"
                  }`}
                >
                  Today's Revenue
                </p>

                <p
                  className={`mt-0.5 text-xl font-bold ${
                    isDark
                      ? "text-white"
                      : "text-slate-950"
                  }`}
                >
                  {formatMoney(todayRevenue)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-600 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* STATISTICS */}

        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: "Orders",
              value: statistics.total,
              description: "Active order groups",
              border: "border-black/[0.07]",
            },
            {
              label: "Pending",
              value: statistics.pending,
              description: "Need attention",
              border: "border-brand/10",
              valueClass:
                "text-brand dark:text-brand",
            },
            {
              label: "Cooking",
              value: statistics.cooking,
              description: "Currently preparing",
              border: "border-brand/10",
              valueClass:
                "text-brand dark:text-brand",
            },
            {
              label: "Ready",
              value: statistics.ready,
              description: "Waiting for pickup",
              border: "border-emerald-400/10",
              valueClass:
                "text-emerald-500 dark:text-emerald-300",
            },
            {
              label: "Cancelled",
              value: statistics.cancelled,
              description: "Cancelled orders",
              border: "border-red-400/10",
              valueClass:
                "text-red-500 dark:text-red-300",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-2xl border p-4 shadow-sm transition-colors duration-300 sm:p-5 ${
                isDark
                  ? `${stat.border} bg-[var(--surface)]`
                  : `${stat.border} bg-card`
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  isDark
                    ? "text-white/40"
                    : "text-slate-500"
                }`}
              >
                {stat.label}
              </p>

              <p
                className={`mt-4 text-2xl font-black ${
                  stat.valueClass || ""
                }`}
              >
                {stat.value}
              </p>

              <p
                className={`mt-1 text-[11px] ${
                  isDark
                    ? "text-white/30"
                    : "text-slate-400"
                }`}
              >
                {stat.description}
              </p>
            </div>
          ))}
        </section>

        {/* ORDERS HEADER */}

        <div className="mb-4 mt-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand dark:text-brand">
              Order Management
            </p>

            <h3 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Incoming Orders
            </h3>
          </div>

          <p
            className={`hidden text-xs sm:block ${
              isDark
                ? "text-white/25"
                : "text-slate-400"
            }`}
          >
            Live updates every few seconds
          </p>
        </div>

        {/* EMPTY */}

        {orders.length === 0 ? (
          <section
            className={`rounded-[28px] border px-6 py-16 text-center shadow-sm transition-colors duration-300 ${
              isDark
                ? "border-white/[0.07] bg-[var(--surface)]"
                : "border-black/[0.07] bg-card"
            }`}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10">
              <PackageCheck className="h-7 w-7 text-brand dark:text-brand" />
            </div>

            <h3 className="mt-5 text-xl font-bold">
              No orders yet
            </h3>

            <p
              className={`mx-auto mt-2 max-w-md text-sm leading-6 ${
                isDark
                  ? "text-white/35"
                  : "text-slate-500"
              }`}
            >
              Orders containing items from your assigned stall
              will appear here automatically.
            </p>
          </section>
        ) : (
          <section className="space-y-5">
            {orders.map((order) =>
              order.stall_orders.map((stallOrder) => {
                const orderCancelled =
                  order.cancelled ||
                  order.status === "Cancelled";

                const stallCancelled =
                  stallOrder.status === "Cancelled" ||
                  Boolean(stallOrder.cancelledAt);

                const action =
                  orderCancelled || stallCancelled
                    ? null
                    : getNextAction(stallOrder.status);

                const statusForDisplay =
                  orderCancelled || stallCancelled
                    ? "Cancelled"
                    : stallOrder.status;

                const statusStyles =
                  getStatusStyles(statusForDisplay);

                const StatusIcon =
                  getStatusIcon(statusForDisplay);

                const stallItems = order.items
                  .map((item, originalIndex) => ({
                    item,
                    originalIndex,
                  }))
                  .filter(
                    ({ item }) =>
                      String(item.stall_id) ===
                      String(stallOrder.stall_id)
                  );

                const updateKey = `${order.order_id}-${stallOrder.stall_id}`;

                const isUpdating =
                  updatingKey === updateKey;

                const remainingSeconds =
                  getRemainingSeconds(
                    stallOrder.cookingStartedAt,
                    stallOrder.estimatedPreparationMinutes
                  );

                const isTakingLonger =
                  stallOrder.status === "Cooking" &&
                  remainingSeconds === 0;

                const progress =
                  orderCancelled || stallCancelled
                    ? 100
                    : getProgress(stallOrder.status);

                const vendorTotal =
                  stallItems.reduce(
                    (sum, { item }) => {
                      if (item.cancelled) {
                        return sum;
                      }

                      return (
                        sum +
                        Number(item.price || 0) *
                          Number(item.quantity || 0)
                      );
                    },
                    0
                  );

                const cancelOrderKey =
                  `order-${order.order_id}-${stallOrder.stall_id}`;

                const cancellingStallOrder =
                  cancellingKey === cancelOrderKey;

                return (
                  <article
                    key={updateKey}
                    className={`overflow-hidden rounded-[28px] border shadow-xl transition-colors duration-300 ${
                      orderCancelled || stallCancelled
                        ? "border-red-500/10"
                        : isDark
                        ? "border-white/[0.07]"
                        : "border-black/[0.07]"
                    } ${
                      isDark
                        ? "bg-[var(--surface)] shadow-black/10"
                        : "bg-card shadow-black/5"
                    }`}
                  >
                    {/* ORDER HEADER */}

                    <div
                      className={`border-b p-4 transition-colors duration-300 sm:p-5 lg:p-6 ${
                        isDark
                          ? "border-white/[0.06]"
                          : "border-black/[0.06]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                            <UserRound className="h-5 w-5 text-brand dark:text-brand" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold">
                                Order #
                                {order.token ??
                                  order.order_id}
                              </p>

                              <span
                                className={`h-1 w-1 rounded-full ${
                                  isDark
                                    ? "bg-white/20"
                                    : "bg-black/20"
                                }`}
                              />

                              <span
                                className={`text-xs ${
                                  isDark
                                    ? "text-white/35"
                                    : "text-slate-400"
                                }`}
                              >
                                {formatDate(
                                  order.created_at
                                )}
                              </span>
                            </div>

                            <p
                              className={`mt-1 text-sm ${
                                isDark
                                  ? "text-white/40"
                                  : "text-slate-500"
                              }`}
                            >
                              {order.name || "Customer"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                          <div>
                            <p
                              className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                isDark
                                  ? "text-white/30"
                                  : "text-slate-400"
                              }`}
                            >
                              Your Total
                            </p>

                            <p className="mt-1 text-xl font-black text-brand dark:text-brand">
                              {formatMoney(vendorTotal)}
                            </p>
                          </div>

                          <div
                            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyles.badge} ${statusStyles.badgeDark}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${statusStyles.dot} ${statusStyles.dotDark}`}
                            />

                            {getStatusLabel(
                              statusForDisplay
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* BODY */}

                    <div className="p-4 sm:p-5 lg:p-6">
                      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                        {/* ITEMS */}

                        <div>
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                              <p
                                className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${
                                  isDark
                                    ? "text-white/30"
                                    : "text-slate-400"
                                }`}
                              >
                                Order Items
                              </p>

                              <p
                                className={`mt-1 text-sm font-semibold ${
                                  isDark
                                    ? "text-white/70"
                                    : "text-slate-700"
                                }`}
                              >
                                {stallItems.length}{" "}
                                {stallItems.length === 1
                                  ? "item"
                                  : "items"}
                              </p>
                            </div>

                            <div
                              className={`hidden items-center gap-2 text-xs sm:flex ${
                                isDark
                                  ? "text-white/25"
                                  : "text-slate-400"
                              }`}
                            >
                              <Store className="h-3.5 w-3.5" />
                              Your Stall
                            </div>
                          </div>

                          <div className="space-y-3">
                            {stallItems.map(
                              ({
                                item,
                                originalIndex,
                              }) => {
                                const imageUrl =
                                  getImageUrl(item.image);

                                const lineTotal =
                                  Number(item.price || 0) *
                                  Number(item.quantity || 0);

                                const itemCancelled =
                                  Boolean(item.cancelled);

                                const itemCancelKey =
                                  `item-${order.order_id}-${stallOrder.stall_id}-${originalIndex}`;

                                const cancellingItem =
                                  cancellingKey ===
                                  itemCancelKey;

                                return (
                                  <div
                                    key={`${item.name}-${originalIndex}`}
                                    className={`rounded-2xl border p-3 transition sm:p-4 ${
                                      itemCancelled
                                        ? "border-red-500/10 bg-red-500/[0.04]"
                                        : isDark
                                        ? "border-white/[0.06] bg-[var(--surface)]"
                                        : "border-black/[0.06] bg-[var(--background)]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 sm:gap-4">
                                      <div
                                        className={`relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl sm:h-[84px] sm:w-[84px] ${
                                          isDark
                                            ? "bg-[var(--surface-tertiary)]"
                                            : "bg-slate-100"
                                        }`}
                                      >
                                        {imageUrl ? (
                                          <img
                                            src={imageUrl}
                                            alt={item.name}
                                            className={`h-full w-full object-cover ${
                                              itemCancelled
                                                ? "opacity-30 grayscale"
                                                : ""
                                            }`}
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center">
                                            <CookingPot
                                              className={`h-6 w-6 ${
                                                isDark
                                                  ? "text-white/20"
                                                  : "text-[var(--border-strong)]"
                                              }`}
                                            />
                                          </div>
                                        )}

                                        {itemCancelled && (
                                          <div className="absolute inset-0 flex items-center justify-center">
                                            <XCircle className="h-7 w-7 text-red-400" />
                                          </div>
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <h4
                                          className={`truncate text-sm font-bold sm:text-base ${
                                            itemCancelled
                                              ? isDark
                                                ? "text-white/35 line-through"
                                                : "text-slate-400 line-through"
                                              : isDark
                                              ? "text-white"
                                              : "text-[var(--text-primary)]"
                                          }`}
                                        >
                                          {item.name}
                                        </h4>

                                        <div
                                          className={`mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${
                                            isDark
                                              ? "text-white/35"
                                              : "text-slate-500"
                                          }`}
                                        >
                                          <span>
                                            Qty:{" "}
                                            <span
                                              className={`font-semibold ${
                                                isDark
                                                  ? "text-white/60"
                                                  : "text-slate-700"
                                              }`}
                                            >
                                              {item.quantity}
                                            </span>
                                          </span>

                                          <span
                                            className={`h-1 w-1 rounded-full ${
                                              isDark
                                                ? "bg-white/15"
                                                : "bg-black/15"
                                            }`}
                                          />

                                          <span>
                                            {formatMoney(
                                              Number(item.price)
                                            )}{" "}
                                            each
                                          </span>
                                        </div>

                                        {itemCancelled && (
                                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-red-500 dark:text-red-400">
                                            Item Cancelled
                                          </p>
                                        )}
                                      </div>

                                      <div className="shrink-0 text-right">
                                        <p
                                          className={`text-sm font-bold sm:text-base ${
                                            itemCancelled
                                              ? isDark
                                                ? "text-white/25 line-through"
                                                : "text-slate-300 line-through"
                                              : isDark
                                              ? "text-white"
                                              : "text-[var(--text-primary)]"
                                          }`}
                                        >
                                          {formatMoney(lineTotal)}
                                        </p>
                                      </div>
                                    </div>

                                    {!itemCancelled &&
                                      !orderCancelled &&
                                      !stallCancelled && (
                                        <button
                                          type="button"
                                          disabled={
                                            cancellingItem ||
                                            Boolean(cancellingKey)
                                          }
                                          onClick={() =>
                                            cancelItem(
                                              order,
                                              stallOrder,
                                              originalIndex,
                                              item
                                            )
                                          }
                                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/15 bg-red-500/[0.04] px-3 py-2 text-xs font-semibold text-red-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300 dark:hover:text-red-200 sm:ml-auto sm:w-auto"
                                        >
                                          {cancellingItem ? (
                                            <>
                                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                              Cancelling...
                                            </>
                                          ) : (
                                            <>
                                              <XCircle className="h-3.5 w-3.5" />
                                              Cancel Item
                                            </>
                                          )}
                                        </button>
                                      )}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {/* STATUS */}

                        <div
                          className={`rounded-2xl border p-4 transition-colors duration-300 ${
                            isDark
                              ? "border-white/[0.06] bg-[var(--surface)]"
                              : "border-black/[0.06] bg-[var(--background)]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p
                                className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                  isDark
                                    ? "text-white/30"
                                    : "text-slate-400"
                                }`}
                              >
                                Order Status
                              </p>

                              <p className="mt-1 text-sm font-bold">
                                {getStatusLabel(
                                  statusForDisplay
                                )}
                              </p>
                            </div>

                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-xl ${statusStyles.badge} ${statusStyles.badgeDark}`}
                            >
                              <StatusIcon className="h-4 w-4" />
                            </div>
                          </div>

                          {!orderCancelled &&
                            !stallCancelled && (
                              <div className="mt-5">
                                <div
                                  className={`h-1.5 overflow-hidden rounded-full ${
                                    isDark
                                      ? "bg-white/5"
                                      : "bg-black/5"
                                  }`}
                                >
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-brand-hover to-brand transition-all duration-500"
                                    style={{
                                      width: `${progress}%`,
                                    }}
                                  />
                                </div>

                                <div
                                  className={`mt-2 flex justify-between text-[9px] font-medium uppercase tracking-wider ${
                                    isDark
                                      ? "text-white/20"
                                      : "text-slate-400"
                                  }`}
                                >
                                  <span>New</span>
                                  <span>Cooking</span>
                                  <span>Ready</span>
                                </div>
                              </div>
                            )}

                          {stallOrder.status ===
                            "Cooking" &&
                            !orderCancelled &&
                            !stallCancelled && (
                              <div
                                className={`mt-5 rounded-xl border p-3 ${
                                  isTakingLonger
                                    ? "border-brand/20 bg-brand/10"
                                    : "border-brand/10 bg-brand/[0.06]"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <TimerReset className="h-4 w-4 text-brand dark:text-brand" />

                                    <span
                                      className={`text-xs font-semibold ${
                                        isDark
                                          ? "text-white/50"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      Preparation
                                    </span>
                                  </div>

                                  <span className="font-mono text-sm font-bold text-brand dark:text-brand">
                                    {formatCountdown(
                                      remainingSeconds
                                    )}
                                  </span>
                                </div>

                                {isTakingLonger ? (
                                  <p className="mt-2 text-[11px] leading-4 text-brand-hover/80 dark:text-brand/70">
                                    Taking longer than expected.
                                    Mark the order ready when it
                                    is actually prepared.
                                  </p>
                                ) : (
                                  <p
                                    className={`mt-2 text-[11px] ${
                                      isDark
                                        ? "text-white/25"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    Estimated preparation:{" "}
                                    {
                                      stallOrder.estimatedPreparationMinutes
                                    }{" "}
                                    min
                                  </p>
                                )}
                              </div>
                            )}

                          {stallOrder.status ===
                            "Ready For Pickup" &&
                            !orderCancelled &&
                            !stallCancelled && (
                              <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-500/[0.06] p-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10">
                                    <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
                                  </div>

                                  <div>
                                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-300">
                                      Ready for pickup
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-emerald-600/50 dark:text-emerald-300/40">
                                      Customer can collect the
                                      order
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                          {(orderCancelled ||
                            stallCancelled) && (
                            <div className="mt-5 rounded-xl border border-red-400/10 bg-red-500/[0.06] p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10">
                                  <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                                </div>

                                <div>
                                  <p className="text-xs font-bold text-red-600 dark:text-red-300">
                                    {orderCancelled
                                      ? "Order cancelled"
                                      : "Stall order cancelled"}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-red-500/50 dark:text-red-300/40">
                                    {orderCancelled
                                      ? "This order is no longer being prepared."
                                      : "This stall is no longer preparing its items."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {action && (
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                updateStatus(
                                  order,
                                  stallOrder,
                                  action.next
                                )
                              }
                              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-[var(--on-primary)] shadow-lg shadow-brand/10 transition hover:bg-brand active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <>
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  {action.label}
                                  <ChevronRight className="h-4 w-4" />
                                </>
                              )}
                            </button>
                          )}

                          {!orderCancelled &&
                            !stallCancelled && (
                              <button
                                type="button"
                                disabled={
                                  Boolean(cancellingKey) ||
                                  Boolean(updatingKey)
                                }
                                onClick={() =>
                                  cancelCompleteOrder(
                                    order,
                                    stallOrder
                                  )
                                }
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-sm font-semibold text-red-500 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-300 dark:hover:text-red-200"
                              >
                                {cancellingStallOrder ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Cancelling Stall...
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Cancel Stall Order
                                  </>
                                )}
                              </button>
                            )}

                          {stallCancelled &&
                            !orderCancelled && (
                              <div className="mt-5 rounded-xl border border-red-400/10 bg-red-500/[0.06] p-3 text-center">
                                <p className="text-xs font-semibold text-red-500 dark:text-red-300">
                                  This stall order is cancelled
                                </p>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}
      </div>
      </main>
    </div>
  );
}