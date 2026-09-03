"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Home,
  ShoppingBag,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";

import { getImageUrl } from "@/app/lib/getImageUrl";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string;
  stall_id?: string;
}

interface InvoiceOrder {
  token?: number | string;
  payment_id?: string;
  razorpay_order_id?: string;
  payment_method?: string;
  payment_status?: string;
  date?: string;
  estimated_time?: string;
  pickup_code?: number | string;
  total?: number;
  email?: string;
  name?: string;
  phone?: string;
  location?: string;
  items?: OrderItem[];
}

interface Stall {
  _id?: string;
  id?: string;
  name?: string;
  image?: string;
  is_open?: boolean;
}

interface StallGroup {
  stallId: string;
  stallName: string;
  stallImage?: string;
  items: OrderItem[];
  subtotal: number;
}

function formatOrderDate(rawDate?: string): string {
  if (!rawDate) return "Not Available";

  const parsed = new Date(rawDate);

  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ============================================================
   PAGE HEADER
============================================================ */

interface PaymentSuccessHeaderProps {
  router: ReturnType<typeof useRouter>;
}

function PaymentSuccessHeader({
  router,
}: PaymentSuccessHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black">
      <div className="relative mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-zinc-900 active:scale-95"
        >
          <ArrowLeft size={24} strokeWidth={2} />
        </button>

        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-tight text-orange-500">
          CampusVita
        </h1>

        <div className="h-10 w-10" />
      </div>
    </header>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function PaymentSuccessPage() {
  const router = useRouter();

  const [order, setOrder] =
    useState<InvoiceOrder | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [stalls, setStalls] =
    useState<Stall[]>([]);

  /* ----------------------------------------------------------
     LOAD ORDER
  ---------------------------------------------------------- */

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    const loadOrder = () => {
      const orderData =
        window.localStorage.getItem("latestOrder");

      if (!orderData) {
        toast.error("No order found");

        redirectTimer = setTimeout(() => {
          router.push("/");
        }, 1500);

        setLoading(false);
        return;
      }

      try {
        const parsedOrder =
          JSON.parse(orderData) as InvoiceOrder;

        setOrder(parsedOrder);
      } catch (error) {
        console.error(
          "Error parsing order:",
          error
        );

        toast.error(
          "Failed to load order details"
        );
      }

      setLoading(false);
    };

    /*
     * Defer the state updates until after the current
     * effect execution. This avoids the React
     * set-state-in-effect lint error.
     */
    const loadTimer =
      setTimeout(loadOrder, 0);

    return () => {
      clearTimeout(loadTimer);

      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [router]);

  /* ----------------------------------------------------------
     LOAD REAL STALL DATA
  ---------------------------------------------------------- */

  useEffect(() => {
    if (!order?.items?.length) {
      return;
    }

    let cancelled = false;

    const loadStalls = async () => {
      try {
        const response =
          await fetch(`${API_URL}/stalls`);

        if (!response.ok) {
          return;
        }

        const data: unknown =
          await response.json();

        const stallList =
          Array.isArray(data)
            ? data
            : typeof data === "object" &&
                data !== null &&
                "stalls" in data
              ? (data as {
                  stalls?: unknown;
                }).stalls
              : undefined;

        if (
          !cancelled &&
          Array.isArray(stallList)
        ) {
          setStalls(
            stallList as Stall[]
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Failed to load stalls:",
            error
          );
        }
      }
    };

    void loadStalls();

    return () => {
      cancelled = true;
    };
  }, [order]);

  /* ----------------------------------------------------------
     GROUP ITEMS BY STALL
  ---------------------------------------------------------- */

  const stallGroups =
    useMemo<StallGroup[]>(() => {
      if (!order?.items?.length) {
        return [];
      }

      const groups =
        new Map<
          string,
          StallGroup
        >();

      order.items.forEach(
        (item) => {
          const stallId =
            String(
              item.stall_id ||
                "unknown"
            );

          const stall =
            stalls.find(
              (currentStall) =>
                String(
                  currentStall._id ||
                    currentStall.id ||
                    ""
                ) === stallId
            );

          const existing =
            groups.get(stallId);

          const itemSubtotal =
            Number(item.price) *
            Number(item.quantity);

          if (existing) {
            existing.items.push(item);
            existing.subtotal +=
              itemSubtotal;
            return;
          }

          groups.set(stallId, {
            stallId,
            stallName:
              stall?.name ||
              `Stall ${stallId}`,
            stallImage:
              stall?.image,
            items: [item],
            subtotal:
              itemSubtotal,
          });
        }
      );

      return Array.from(
        groups.values()
      );
    }, [order, stalls]);

  /* ----------------------------------------------------------
     ACTIONS
  ---------------------------------------------------------- */

  const handleTrackOrder = () => {
    router.push("/track-order");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  /* ----------------------------------------------------------
     LOADING
  ---------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black">
          <div className="relative mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-zinc-900"
            >
              <ArrowLeft
                size={24}
                strokeWidth={2}
              />
            </button>

            <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-tight text-orange-500">
              CampusVita
            </h1>

            <div className="h-10 w-10" />
          </div>
        </header>

        <main className="flex min-h-screen items-center justify-center bg-black text-white">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-zinc-800 border-t-orange-500" />

            <p className="mt-4 text-sm text-zinc-400">
              Loading order confirmation...
            </p>
          </div>
        </main>
      </>
    );
  }

  /* ----------------------------------------------------------
     NO ORDER
  ---------------------------------------------------------- */

  if (!order) {
    return (
      <>
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-black">
          <div className="relative mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-zinc-900"
            >
              <ArrowLeft
                size={24}
                strokeWidth={2}
              />
            </button>

            <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-tight text-orange-500">
              CampusVita
            </h1>

            <div className="h-10 w-10" />
          </div>
        </header>

        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
          <div className="text-center">
            <p className="text-zinc-400">
              No order found.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/")
              }
              className="mt-5 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
            >
              Go to Home
            </button>
          </div>
        </main>
      </>
    );
  }

  /* ----------------------------------------------------------
     ORDER TOTALS
  ---------------------------------------------------------- */

  const total =
    Number(order.total ?? 0);

  const totalItems =
    order.items?.reduce(
      (sum, item) =>
        sum + Number(item.quantity),
      0
    ) ?? 0;

  /* ----------------------------------------------------------
     MAIN UI
  ---------------------------------------------------------- */

  return (
    <>
      <PaymentSuccessHeader
        router={router}
      />

      <main className="min-h-screen bg-black px-4 pb-28 pt-6 text-white sm:px-6 md:px-8">
        <div className="mx-auto w-full max-w-3xl">

          {/* ==================================================
              SUCCESS HEADER
          ================================================== */}

          <section className="mb-6 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 ring-1 ring-green-500/20">
              <CheckCircle2
                size={48}
                strokeWidth={2}
                className="text-green-500"
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Order Confirmed
            </h1>

            <p className="mt-2 text-sm text-zinc-400 sm:text-base">
              Your order has been placed successfully.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="rounded-full bg-zinc-900 px-4 py-2 text-zinc-300 ring-1 ring-zinc-800">
                Token #{order.token ?? "N/A"}
              </span>

              <span className="rounded-full bg-green-500/10 px-4 py-2 font-medium text-green-400 ring-1 ring-green-500/20">
                Payment Paid
              </span>
            </div>
          </section>

          {/* ==================================================
              ORDER INFORMATION
          ================================================== */}

          <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-xl">
            <div className="border-b border-zinc-800 px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">
                    Order Information
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {totalItems}{" "}
                    {totalItems === 1
                      ? "item"
                      : "items"}{" "}
                    from{" "}
                    {stallGroups.length}{" "}
                    {stallGroups.length === 1
                      ? "stall"
                      : "stalls"}
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-orange-500/10 p-3 sm:block">
                  <ShoppingBag
                    size={24}
                    className="text-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* =================================================
                STALL GROUPS
            ================================================= */}

            <div className="divide-y divide-zinc-800">
              {stallGroups.length > 0 ? (
                stallGroups.map(
                  (group) => {
                    const groupItemCount =
                      group.items.reduce(
                        (
                          sum,
                          item
                        ) =>
                          sum +
                          Number(
                            item.quantity
                          ),
                        0
                      );

                    return (
                      <div
                        key={
                          group.stallId
                        }
                        className="px-5 py-5 sm:px-6"
                      >
                        {/* STALL HEADER */}

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
                              {group.stallImage ? (
                                <Image
                                src={getImageUrl(group.stallImage)}
                                alt={group.stallName}
                                width={44}
                                height={44}
                                className="h-full w-full object-cover"
                              />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Store
                                    size={21}
                                    className="text-orange-500"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h3 className="truncate text-base font-bold sm:text-lg">
                                {
                                  group.stallName
                                }
                              </h3>

                              <p className="text-xs text-zinc-500 sm:text-sm">
                                {
                                  groupItemCount
                                }{" "}
                                {groupItemCount ===
                                1
                                  ? "Item"
                                  : "Items"}
                              </p>
                            </div>
                          </div>

                          <span className="shrink-0 text-base font-bold text-white sm:text-lg">
                            ₹
                            {group.subtotal.toFixed(
                              2
                            )}
                          </span>
                        </div>

                        {/* ITEMS */}

                        <div className="mt-4 space-y-3">
                          {group.items.map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={`${group.stallId}-${item.name}-${index}`}
                                className="flex items-center gap-3 rounded-2xl bg-zinc-900/70 p-3"
                              >
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                                  {item.image ? (
                                   <Image
                                   src={getImageUrl(item.image)}
                                   alt={item.name}
                                   width={56}
                                   height={56}
                                   unoptimized
                                   className="h-full w-full object-cover"
                                 />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <ShoppingBag
                                        size={20}
                                        className="text-zinc-500"
                                      />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-semibold text-white sm:text-base">
                                    {
                                      item.name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                                    ₹
                                    {Number(
                                      item.price
                                    ).toFixed(
                                      2
                                    )}{" "}
                                    ×{" "}
                                    {
                                      item.quantity
                                    }
                                  </p>
                                </div>

                                <p className="shrink-0 text-sm font-semibold text-zinc-200 sm:text-base">
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
                    );
                  }
                )
              ) : (
                <div className="px-6 py-10 text-center text-sm text-zinc-500">
                  No order items found.
                </div>
              )}
            </div>

            {/* =================================================
                TOTAL
            ================================================= */}

            <div className="border-t border-zinc-800 bg-zinc-900/40 px-5 py-5 sm:px-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">
                    Total Paid
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {formatOrderDate(
                      order.date
                    )}
                  </p>
                </div>

                <p className="text-2xl font-extrabold text-orange-500 sm:text-3xl">
                  ₹{total.toFixed(2)}
                </p>
              </div>
            </div>
          </section>

          {/* ==================================================
              ACTION BUTTONS
          ================================================== */}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {/* TRACK ORDER */}

            <button
              type="button"
              onClick={
                handleTrackOrder
              }
              className="group flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-white transition hover:bg-orange-600 active:scale-[0.99]"
            >
              <ShoppingBag size={21} />

              Track Order

              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            {/* BACK TO HOME */}

            <button
              type="button"
              onClick={
                handleBackToHome
              }
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-base font-bold text-white transition hover:border-orange-500 hover:text-orange-500 active:scale-[0.99]"
            >
              <Home size={20} />

              Back to Home
            </button>
          </div>
        </div>
      </main>
    </>
  );
}