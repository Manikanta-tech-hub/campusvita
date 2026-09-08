"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import {
  Check,
  Clock3,
  Package,
  RefreshCw,
  Store,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import Navbar from "@/components/layout/Navbar";
import { getImageUrl } from "@/app/lib/getImageUrl";
import {
  getAccessToken,
  getSessionUser,
} from "@/app/lib/auth/session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

/* ============================================================
   TYPES
   ============================================================ */

type OrderItem = {
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  stall_id?: string | null;

  cancelled?: boolean;

  cancelledAt?: string | null;
  cancellationReason?: string | null;

  // Backend compatibility
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
};

type StallState = {
  stall_id: string;
  status: string;
  estimatedPreparationMinutes: number;

  cookingStartedAt?: string | null;
  readyAt?: string | null;

  cancelled?: boolean;

  cancelledAt?: string | null;
  cancellationReason?: string | null;

  // Backend compatibility
  cancelled_at?: string | null;
  cancellation_reason?: string | null;

  stall_name?: string | null;
};

type Order = {
  _id?: string;
  order_id?: string;
  token: number;

  status?: string;

  date?: string;
  created_at?: string;

  email?: string;
  user_email?: string;

  total?: number;
  pickup_code?: string;

  items: OrderItem[];

  stall_orders?: StallState[];

  cancelled?: boolean;

  cancelledAt?: string | null;
  cancellationReason?: string | null;

  // Backend compatibility
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
};

type Stall = {
  _id?: string;
  id?: string;
  name: string;
  image?: string;
};

/* ============================================================
   STATUS
   ============================================================ */

const STATUS_ORDER = [
  "Pending",
  "Accepted",
  "Placed",
  "Cooking",
  "Ready For Pickup",
];

const statusRank = (status: string) => {
  const index = STATUS_ORDER.indexOf(status);

  return index === -1 ? 0 : index;
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStallStatusLabel = (status?: string) => {
  switch (status) {
    case "Pending":
      return "Waiting";

    case "Accepted":
      return "Accepted";

    case "Placed":
      return "Placed";

    case "Cooking":
      return "Cooking";

    case "Ready For Pickup":
      return "Ready";

    case "Cancelled":
      return "Cancelled";

    default:
      return "Preparing";
  }
};

/* ============================================================
   CANCELLATION HELPERS
   ============================================================ */

const isCancelledItem = (item?: OrderItem | null) => {
  return item?.cancelled === true;
};

const isCancelledStall = (stall?: StallState | null) => {
  return (
    stall?.cancelled === true ||
    stall?.status === "Cancelled"
  );
};

const getItemCancellationReason = (
  item?: OrderItem | null
) => {
  return (
    item?.cancellationReason ||
    item?.cancellation_reason ||
    null
  );
};

const getStallCancellationReason = (
  stall?: StallState | null
) => {
  return (
    stall?.cancellationReason ||
    stall?.cancellation_reason ||
    null
  );
};

const getOrderCancellationReason = (
  order?: Order | null
) => {
  return (
    order?.cancellationReason ||
    order?.cancellation_reason ||
    null
  );
};

/*
 * Stable item identity for comparing the previous
 * realtime order with the new realtime order.
 */
const getItemKey = (
  item: OrderItem,
  index: number
) => {
  return [
    String(item.stall_id || ""),
    String(item.name || ""),
    String(index),
  ].join("::");
};

/* ============================================================
   OVERALL STATUS
   ============================================================ */

const getOverallStatus = (
  order?: Order | null
) => {
  if (!order) {
    return "Pending";
  }

  /*
   * A complete cancellation always takes priority.
   */
  if (order.cancelled) {
    return "Cancelled";
  }

  const states = order.stall_orders || [];

  /*
   * If every item has been cancelled,
   * the entire order is effectively cancelled.
   */
  const items = order.items || [];

  if (
    items.length > 0 &&
    items.every(
      (item) => item.cancelled === true
    )
  ) {
    return "Cancelled";
  }

  if (!states.length) {
    return order.status || "Pending";
  }

  /*
   * Ignore cancelled stalls when deriving
   * active overall preparation status.
   */
  const activeStates = states.filter(
    (state) =>
      !isCancelledStall(state)
  );

  /*
   * If every stall is cancelled,
   * the order is cancelled.
   */
  if (
    states.length > 0 &&
    activeStates.length === 0 &&
    states.every((state) =>
      isCancelledStall(state)
    )
  ) {
    return "Cancelled";
  }

  if (!activeStates.length) {
    return order.status || "Pending";
  }

  const statuses = activeStates.map(
    (state) => state.status
  );

  if (
    statuses.length > 0 &&
    statuses.every(
      (status) =>
        status === "Ready For Pickup"
    )
  ) {
    return "Ready For Pickup";
  }

  if (
    statuses.some(
      (status) => status === "Cooking"
    ) &&
    statuses.some(
      (status) =>
        status === "Ready For Pickup"
    )
  ) {
    return "Partially Ready";
  }

  if (
    statuses.some(
      (status) => status === "Cooking"
    )
  ) {
    return "Cooking";
  }

  if (
    statuses.some(
      (status) => status === "Placed"
    )
  ) {
    return "Placed";
  }

  if (
    statuses.some(
      (status) => status === "Accepted"
    )
  ) {
    return "Accepted";
  }

  return "Pending";
};

/* ============================================================
   FALLBACK STALL STATES
   ============================================================ */

const buildFallbackStallStates = (
  order: Order
): StallState[] => {
  /*
   * If backend already supplied stall_orders,
   * preserve them exactly, including cancellation
   * fields.
   */
  if (
    Array.isArray(order.stall_orders) &&
    order.stall_orders.length > 0
  ) {
    return order.stall_orders;
  }

  /*
   * Identify real stalls from real order items.
   */
  const ids = Array.from(
    new Set(
      order.items
        .map((item) =>
          String(
            item.stall_id || ""
          ).trim()
        )
        .filter(Boolean)
    )
  );

  return ids.map((stall_id) => ({
    stall_id,
    status: "Pending",
    estimatedPreparationMinutes: 0,

    cookingStartedAt: null,
    readyAt: null,

    cancelled: false,
    cancelledAt: null,
    cancellationReason: null,
  }));
};

/* ============================================================
   STALL NAME HELPER
   ============================================================ */

const findStallName = (
  stalls: Stall[],
  stallId: string
) => {
  const stall = stalls.find(
    (item) =>
      String(
        item._id || item.id
      ) === String(stallId)
  );

  return (
    stall?.name ||
    "CampusVita Stall"
  );
};

/* ============================================================
   COUNTDOWN
   ============================================================ */

const getRemainingSeconds = (
  stall: StallState,
  now: number
) => {
  if (
    isCancelledStall(stall) ||
    stall.status !== "Cooking" ||
    !stall.cookingStartedAt ||
    !stall.estimatedPreparationMinutes
  ) {
    return null;
  }

  const started = new Date(
    stall.cookingStartedAt
  ).getTime();

  if (Number.isNaN(started)) {
    return null;
  }

  const end =
    started +
    stall.estimatedPreparationMinutes *
      60 *
      1000;

  return Math.max(
    0,
    Math.floor(
      (end - now) / 1000
    )
  );
};

const formatCountdown = (
  seconds: number
) => {
  const minutes = Math.floor(
    seconds / 60
  );

  const remainingSeconds =
    seconds % 60;

  return `${String(minutes).padStart(
    2,
    "0"
  )}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

/* ============================================================
   OVERALL STATUS DESCRIPTION
   ============================================================ */

const getOverallStatusDescription = (
  status: string
) => {
  switch (status) {
    case "Cancelled":
      return "This order has been cancelled.";

    case "Partially Ready":
      return "Some items are ready while others are being prepared.";

    case "Ready For Pickup":
      return "Your order is ready for pickup.";

    case "Cooking":
      return "Your food is being prepared right now.";

    case "Placed":
      return "Your order has been placed with the stalls.";

    case "Accepted":
      return "Your order has been accepted by the vendors.";

    default:
      return "Your order is waiting for vendor confirmation.";
  }
};

/* ============================================================
   PAGE
   ============================================================ */

export default function TrackOrderPage() {
  const [order, setOrder] =
    useState<Order | null>(null);

  const [stalls, setStalls] =
    useState<Stall[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [now, setNow] =
    useState(Date.now());

  const user =
    getSessionUser("USER");

  const accessToken =
    getAccessToken("USER");

  /*
   * Keep the latest order in a ref so the Socket.IO
   * callback can compare old vs new cancellation state.
   */
  const orderRef =
    useRef<Order | null>(null);

  /*
   * Prevent duplicate cancellation notifications
   * if Socket.IO delivers the same event more than once.
   */
  const notifiedCancellationKeys =
    useRef<Set<string>>(new Set());

  /* ============================================================
     LOAD ORDER
     ============================================================ */

  const loadOrder = useCallback(
    async (showRefresh = false) => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      }

      try {
        const [
          ordersResponse,
          stallsResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/orders`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }),

          fetch(`${API_URL}/stalls`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }),
        ]);

        if (!ordersResponse.ok) {
          throw new Error(
            "Unable to load orders"
          );
        }

        const ordersData =
          await ordersResponse.json();

        const stallsData =
          stallsResponse.ok
            ? await stallsResponse.json()
            : [];

        const orders: Order[] =
          Array.isArray(ordersData)
            ? ordersData
            : ordersData.orders || [];

        const stallList: Stall[] =
          Array.isArray(stallsData)
            ? stallsData
            : stallsData.stalls || [];

        setStalls(stallList);

        if (!orders.length) {
          orderRef.current = null;
          setOrder(null);
          return;
        }

        /*
         * Always use newest real order from backend.
         */
        const sortedOrders =
          [...orders].sort(
            (a, b) => {
              const aTime =
                new Date(
                  a.created_at ||
                    a.date ||
                    0
                ).getTime();

              const bTime =
                new Date(
                  b.created_at ||
                    b.date ||
                    0
                ).getTime();

              return bTime - aTime;
            }
          );

        const latestOrder =
          sortedOrders[0];

        const normalizedOrder: Order = {
          ...latestOrder,
          stall_orders:
            buildFallbackStallStates(
              latestOrder
            ),
        };

        /*
         * Backend remains the source of truth.
         */
        orderRef.current =
          normalizedOrder;

        setOrder(
          normalizedOrder
        );

        localStorage.setItem(
          "campusvita_latest_order",
          JSON.stringify(
            normalizedOrder
          )
        );
      } catch (error) {
        console.error(
          "Track order load error:",
          error
        );

        toast.error(
          "Unable to load your order"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken]
  );

  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  /* ============================================================
     COUNTDOWN DISPLAY ONLY
     ============================================================ */

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        setNow(Date.now());
      }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* ============================================================
     SOCKET.IO REALTIME
     ============================================================ */

  useEffect(() => {
    if (
      !accessToken ||
      !user?.email
    ) {
      return;
    }

    const socket = io(API_URL, {
      transports: [
        "polling",
        "websocket",
      ],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log(
        "CampusVita tracking socket connected"
      );
    });

    socket.on(
      "order_update",
      (updatedOrder: Order) => {
        const eventEmail =
          updatedOrder.email ||
          updatedOrder.user_email;

        /*
         * Never display another customer's order.
         */
        if (
          eventEmail &&
          eventEmail.toLowerCase() !==
            user.email.toLowerCase()
        ) {
          return;
        }

        /*
         * Make sure this is the same order.
         */
        const currentOrder =
          orderRef.current;

        if (
          currentOrder?.token &&
          updatedOrder.token &&
          currentOrder.token !==
            updatedOrder.token
        ) {
          return;
        }

        const normalizedUpdatedOrder:
          Order = {
          ...updatedOrder,
          stall_orders:
            buildFallbackStallStates(
              updatedOrder
            ),
        };

        /* ======================================================
           FIND NEWLY CANCELLED STALLS
           ====================================================== */

        const previousStalls =
          currentOrder?.stall_orders ||
          [];

        const updatedStalls =
          normalizedUpdatedOrder.stall_orders ||
          [];

        const newlyCancelledStalls =
          updatedStalls.filter(
            (updatedStall) => {
              if (
                !isCancelledStall(
                  updatedStall
                )
              ) {
                return false;
              }

              const previousStall =
                previousStalls.find(
                  (stall) =>
                    String(
                      stall.stall_id
                    ) ===
                    String(
                      updatedStall.stall_id
                    )
                );

              return (
                !previousStall ||
                !isCancelledStall(
                  previousStall
                )
              );
            }
          );

        const newlyCancelledStallIds =
          new Set(
            newlyCancelledStalls.map(
              (stall) =>
                String(
                  stall.stall_id
                )
            )
          );

        /* ======================================================
           FIND NEWLY CANCELLED ITEMS
           ====================================================== */

        const previousItems =
          currentOrder?.items || [];

        const updatedItems =
          normalizedUpdatedOrder.items ||
          [];

        const newlyCancelledItems =
          updatedItems.filter(
            (updatedItem, index) => {
              if (
                !isCancelledItem(
                  updatedItem
                )
              ) {
                return false;
              }

              /*
               * If the whole stall was cancelled,
               * do NOT show individual item popups.
               *
               * We show one clean stall-level notification
               * instead.
               */
              const itemStallId =
                String(
                  updatedItem.stall_id ||
                    ""
                );

              if (
                newlyCancelledStallIds.has(
                  itemStallId
                )
              ) {
                return false;
              }

              const previousItem =
                previousItems[index];

              /*
               * Only notify when the item changes
               * from active -> cancelled.
               */
              if (
                previousItem &&
                isCancelledItem(
                  previousItem
                )
              ) {
                return false;
              }

              return true;
            }
          );

        /* ======================================================
           UPDATE ORDER STATE
           ====================================================== */

        orderRef.current =
          normalizedUpdatedOrder;

        setOrder(
          normalizedUpdatedOrder
        );

        /* ======================================================
           STALL CANCELLATION NOTIFICATION
           ====================================================== */

        newlyCancelledStalls.forEach(
          (cancelledStall) => {
            const stallId =
              String(
                cancelledStall.stall_id
              );

            const notificationKey =
              `stall-cancelled-${normalizedUpdatedOrder.token}-${stallId}`;

            if (
              notifiedCancellationKeys.current.has(
                notificationKey
              )
            ) {
              return;
            }

            notifiedCancellationKeys.current.add(
              notificationKey
            );

            const stallName =
              cancelledStall.stall_name ||
              findStallName(
                stalls,
                stallId
              );

            const reason =
              getStallCancellationReason(
                cancelledStall
              );

            toast.error(
              reason
                ? `${stallName} order was cancelled: ${reason}`
                : `${stallName} order was cancelled by the vendor.`
            );
          }
        );

        /* ======================================================
           ITEM CANCELLATION NOTIFICATION
           ====================================================== */

        newlyCancelledItems.forEach(
          (cancelledItem, index) => {
            const itemName =
              cancelledItem.name ||
              "Food item";

            const stallId =
              String(
                cancelledItem.stall_id ||
                  ""
              );

            const itemKey =
              getItemKey(
                cancelledItem,
                index
              );

            const notificationKey =
              `item-cancelled-${normalizedUpdatedOrder.token}-${itemKey}`;

            if (
              notifiedCancellationKeys.current.has(
                notificationKey
              )
            ) {
              return;
            }

            notifiedCancellationKeys.current.add(
              notificationKey
            );

            const reason =
              getItemCancellationReason(
                cancelledItem
              );

            toast.error(
              reason
                ? `"${itemName}" was cancelled: ${reason}`
                : `"${itemName}" was cancelled by the vendor.`
            );
          }
        );

        /* ======================================================
           COMPLETE ORDER CANCELLATION
           ====================================================== */

        if (
          normalizedUpdatedOrder.cancelled &&
          !currentOrder?.cancelled
        ) {
          const notificationKey =
            `order-cancelled-${normalizedUpdatedOrder.token}`;

          if (
            !notifiedCancellationKeys.current.has(
              notificationKey
            )
          ) {
            notifiedCancellationKeys.current.add(
              notificationKey
            );

            const reason =
              getOrderCancellationReason(
                normalizedUpdatedOrder
              );

            toast.error(
              reason
                ? `Your order was cancelled: ${reason}`
                : "Your entire order was cancelled by the vendor."
            );
          }

          return;
        }

        /*
         * IMPORTANT:
         *
         * Do not show "Order status updated"
         * when this Socket.IO event was caused by
         * a cancellation.
         *
         * Cancellation already has its own
         * specific notification above.
         */
        const hadCancellation =
          newlyCancelledStalls.length >
            0 ||
          newlyCancelledItems.length >
            0;

        if (!hadCancellation) {
          toast.success(
            "Order status updated"
          );
        }
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.warn(
          "Tracking socket connection error:",
          error.message
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [
    accessToken,
    user?.email,
    stalls,
  ]);

  /* ============================================================
     MEMOS
     ============================================================ */

  const stallStates = useMemo(
    () =>
      order?.stall_orders || [],
    [order]
  );

  /*
   * A stall disappears from active tracking when
   * the entire stall order has been cancelled.
   *
   * This does NOT remove a stall merely because one
   * individual item was cancelled.
   */
  const visibleStallStates =
    useMemo(() => {
      return stallStates.filter(
        (stallState) => {
          if (
            isCancelledStall(
              stallState
            )
          ) {
            return false;
          }

          const stallItems =
            order?.items.filter(
              (item) =>
                String(
                  item.stall_id || ""
                ) ===
                String(
                  stallState.stall_id
                )
            ) || [];

          /*
           * If every item belonging to this stall
           * is cancelled, hide the stall from active
           * tracking even if the backend stall state
           * has not yet marked it cancelled.
           */
          if (
            stallItems.length > 0 &&
            stallItems.every(
              (item) =>
                item.cancelled === true
            )
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      stallStates,
      order?.items,
    ]);

  const overallStatus = useMemo(
    () =>
      getOverallStatus(order),
    [order]
  );

  const getStallName =
    useCallback(
      (stallId: string) => {
        return findStallName(
          stalls,
          stallId
        );
      },
      [stalls]
    );

  const getStallImage =
    useCallback(
      (stallId: string) => {
        const stall =
          stalls.find(
            (item) =>
              String(
                item._id || item.id
              ) ===
              String(stallId)
          );

        return stall?.image
          ? getImageUrl(
              stall.image
            )
          : null;
      },
      [stalls]
    );

  const itemsForStall =
    useCallback(
      (stallId: string) => {
        return (
          order?.items.filter(
            (item) =>
              String(
                item.stall_id || ""
              ) ===
              String(stallId)
          ) || []
        );
      },
      [order]
    );

  const readyStalls =
    visibleStallStates.filter(
      (stall) =>
        stall.status ===
        "Ready For Pickup"
    ).length;

  const activeStalls =
    visibleStallStates.length;

  const cancelledItemCount =
    order?.items.filter(
      (item) => item.cancelled
    ).length || 0;

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#070809] px-4 pb-28 pt-24 text-white">
          <div className="mx-auto max-w-6xl animate-pulse">
            <div className="h-8 w-40 rounded-lg bg-white/10" />

            <div className="mt-3 h-4 w-72 rounded bg-white/5" />

            <div className="mt-8 h-44 rounded-3xl bg-white/5" />

            <div className="mt-6 h-32 rounded-3xl bg-white/5" />

            <div className="mt-6 h-96 rounded-3xl bg-white/5" />
          </div>
        </main>
      </>
    );
  }

  /* ============================================================
     NO ORDER
     ============================================================ */

  if (!order) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-[#070809] px-4 pb-28 pt-24 text-white">
          <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
            <div className="w-full rounded-[28px] border border-white/10 bg-[#111315] p-8 text-center shadow-2xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
                <Package className="h-8 w-8 text-orange-500" />
              </div>

              <h1 className="mt-6 text-2xl font-black">
                No order found
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Your latest order will appear
                here once it is available.
              </p>

              <button
                onClick={() =>
                  loadOrder(true)
                }
                disabled={refreshing}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Refresh
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* ============================================================
     MAIN PAGE
     ============================================================ */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#070809] px-3 pb-28 pt-20 text-white sm:px-5 sm:pt-24">
        <div className="mx-auto max-w-6xl">

          {/* =====================================================
              PAGE HEADER
          ===================================================== */}

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                CampusVita
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
                Track Order
              </h1>

              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                Follow every stall preparing
                your order in real time.
              </p>
            </div>

            <button
              onClick={() =>
                loadOrder(true)
              }
              disabled={refreshing}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#151719] transition hover:border-orange-500/30 hover:bg-[#1b1d20] disabled:opacity-50 sm:h-11 sm:w-11"
              aria-label="Refresh order"
            >
              <RefreshCw
                className={`h-4 w-4 sm:h-5 sm:w-5 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
          </div>

          {/* =====================================================
              ORDER HEADER CARD
          ===================================================== */}

          <section
            className={`mt-6 overflow-hidden rounded-[26px] border shadow-[0_20px_70px_rgba(0,0,0,0.35)] ${
              order.cancelled
                ? "border-white/10 bg-[#090a0b]"
                : "border-orange-500/25 bg-gradient-to-br from-[#391b09] via-[#24150d] to-[#111315]"
            }`}
          >
            <div
              className={`p-5 sm:p-7 ${
                order.cancelled
                  ? "opacity-70"
                  : ""
              }`}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300/70 sm:text-xs">
                    Order ID
                  </div>

                  <div className="mt-1 text-2xl font-black sm:text-3xl">
                    #CV
                    {String(
                      order.token
                    ).padStart(5, "0")}
                  </div>

                  <div className="mt-2 text-xs text-orange-100/60 sm:text-sm">
                    {formatDate(
                      order.created_at ||
                        order.date
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300/70 sm:text-xs">
                    Total Amount
                  </div>

                  <div className="mt-1 text-xl font-black sm:text-2xl">
                    ₹
                    {Number(
                      order.total || 0
                    ).toFixed(2)}
                  </div>
                </div>

                <div
                  className={`rounded-xl border px-4 py-2 text-center sm:px-5 ${
                    order.cancelled
                      ? "border-white/10 bg-black text-gray-400"
                      : "border-orange-400/30 bg-black/20"
                  }`}
                >
                  <div
                    className={`text-sm font-bold ${
                      order.cancelled
                        ? "text-gray-400"
                        : "text-orange-300"
                    }`}
                  >
                    {overallStatus}
                  </div>
                </div>

              </div>

              {/* Complete cancellation message */}
              {order.cancelled && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-black/60 p-4">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

                  <div>
                    <div className="text-sm font-bold text-gray-300">
                      Order Cancelled
                    </div>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      {getOrderCancellationReason(
                        order
                      ) ||
                        "This order was cancelled by the vendor."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* =====================================================
              OVERALL STATUS
          ===================================================== */}

          <section
            className={`mt-5 rounded-[26px] border p-5 sm:p-7 ${
              order.cancelled
                ? "border-white/10 bg-[#090a0b]"
                : "border-white/10 bg-[#101214]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold sm:text-lg">
                  Overall Order Status
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                  {getOverallStatusDescription(
                    overallStatus
                  )}
                </p>
              </div>

              <div
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold sm:text-xs ${
                  order.cancelled
                    ? "border-white/10 bg-black text-gray-500"
                    : "border-orange-500/20 bg-orange-500/10 text-orange-400"
                }`}
              >
                {order.cancelled
                  ? "Cancelled"
                  : `${readyStalls}/${activeStalls} Ready`}
              </div>
            </div>

            {/* =================================================
                COMPLETE CANCELLATION STATE
            ================================================= */}

            {order.cancelled ? (
              <div className="mt-7 rounded-2xl border border-white/10 bg-black/70 p-6 text-center">
                <XCircle className="mx-auto h-9 w-9 text-gray-600" />

                <div className="mt-3 text-sm font-black text-gray-400">
                  Order Cancelled
                </div>

                <p className="mt-1 text-xs text-gray-700">
                  No further preparation is taking place.
                </p>
              </div>
            ) : (
              <>
                {/* Overall timeline */}
                <div className="mt-7 hidden sm:block">
                  <div className="relative">
                    <div className="absolute left-[8%] right-[8%] top-5 h-[2px] bg-white/10" />

                    <div
                      className="absolute left-[8%] top-5 h-[2px] bg-orange-500 transition-all duration-500"
                      style={{
                        width:
                          overallStatus ===
                          "Ready For Pickup"
                            ? "84%"
                            : overallStatus ===
                                "Partially Ready"
                              ? "58%"
                              : overallStatus ===
                                  "Cooking"
                                ? "45%"
                                : overallStatus ===
                                    "Placed"
                                  ? "25%"
                                  : "5%",
                      }}
                    />

                    <div className="relative grid grid-cols-3">
                      {[
                        {
                          label: "Placed",
                          active:
                            statusRank(
                              overallStatus
                            ) >=
                            statusRank(
                              "Placed"
                            ),
                        },
                        {
                          label: "Cooking",
                          active:
                            overallStatus ===
                              "Cooking" ||
                            overallStatus ===
                              "Partially Ready" ||
                            overallStatus ===
                              "Ready For Pickup",
                        },
                        {
                          label: "Ready",
                          active:
                            overallStatus ===
                            "Ready For Pickup",
                        },
                      ].map(
                        (step) => (
                          <div
                            key={
                              step.label
                            }
                            className="flex flex-col items-center"
                          >
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                                step.active
                                  ? "border-orange-400 bg-orange-500 text-black"
                                  : "border-white/10 bg-[#191c1f] text-gray-600"
                              }`}
                            >
                              {step.active ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <span className="text-xs font-bold">
                                  •
                                </span>
                              )}
                            </div>

                            <span
                              className={`mt-2 text-xs font-semibold ${
                                step.active
                                  ? "text-white"
                                  : "text-gray-600"
                              }`}
                            >
                              {
                                step.label
                              }
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile overall status */}
                <div className="mt-5 grid grid-cols-3 gap-2 sm:hidden">
                  {[
                    "Placed",
                    "Cooking",
                    "Ready",
                  ].map(
                    (label) => {
                      const active =
                        label ===
                          "Placed"
                          ? statusRank(
                              overallStatus
                            ) >=
                            statusRank(
                              "Placed"
                            )
                          : label ===
                              "Cooking"
                            ? [
                                "Cooking",
                                "Partially Ready",
                                "Ready For Pickup",
                              ].includes(
                                overallStatus
                              )
                            : overallStatus ===
                              "Ready For Pickup";

                      return (
                        <div
                          key={label}
                          className={`rounded-xl border px-2 py-3 text-center ${
                            active
                              ? "border-orange-500/30 bg-orange-500/10 text-orange-400"
                              : "border-white/5 bg-white/[0.025] text-gray-600"
                          }`}
                        >
                          <div className="text-[10px] font-bold">
                            {label}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </>
            )}
          </section>

          {/* =====================================================
              STALL-WISE TRACKING
          ===================================================== */}

          <section className="mt-6">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-lg font-black sm:text-xl">
                  Stall Wise Tracking
                </h2>

                <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                  Each stall updates independently.
                </p>
              </div>
            </div>

            {visibleStallStates.length ===
              0 ? (
              <div className="rounded-[26px] border border-white/10 bg-[#101214] p-8 text-center">
                <XCircle className="mx-auto h-8 w-8 text-gray-700" />

                <div className="mt-3 text-sm font-bold text-gray-500">
                  No active stall orders
                </div>

                <p className="mt-1 text-xs text-gray-700">
                  All stall orders have been cancelled.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {visibleStallStates.map(
                  (stallState) => {
                    const stallItems =
                      itemsForStall(
                        stallState.stall_id
                      );

                    const remaining =
                      getRemainingSeconds(
                        stallState,
                        now
                      );

                    const isCancelled =
                      isCancelledStall(
                        stallState
                      );

                    const isCooking =
                      !isCancelled &&
                      stallState.status ===
                        "Cooking";

                    const isReady =
                      !isCancelled &&
                      stallState.status ===
                        "Ready For Pickup";

                    const isOverdue =
                      isCooking &&
                      remaining !== null &&
                      remaining <= 0;

                    const currentRank =
                      statusRank(
                        stallState.status
                      );

                    const stallImage =
                      getStallImage(
                        stallState.stall_id
                      );

                    return (
                      <article
                        key={
                          stallState.stall_id
                        }
                        className="overflow-hidden rounded-[26px] border border-white/10 bg-[#101214] shadow-[0_18px_60px_rgba(0,0,0,0.28)]"
                      >

                        {/* =================================================
                            STALL HEADER
                        ================================================= */}

                        <div className="p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#1c1f22]">
                              {stallImage ? (
                                <img
                                  src={
                                    stallImage
                                  }
                                  alt={getStallName(
                                    stallState.stall_id
                                  )}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Store className="h-6 w-6 text-orange-500" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate text-base font-black sm:text-lg">
                                    {getStallName(
                                      stallState.stall_id
                                    )}
                                  </h3>

                                  <p className="mt-1 text-[11px] text-gray-600 sm:text-xs">
                                    {
                                      stallItems.length
                                    }{" "}
                                    item
                                    {stallItems.length !==
                                    1
                                      ? "s"
                                      : ""}
                                  </p>
                                </div>

                                <div
                                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold sm:text-xs ${
                                    isReady
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : isCooking
                                        ? "bg-orange-500/15 text-orange-400"
                                        : "bg-white/5 text-gray-400"
                                  }`}
                                >
                                  {getStallStatusLabel(
                                    stallState.status
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* =================================================
                              TIMER
                          ================================================= */}

                          {isCooking && (
                            <div
                              className={`mt-4 rounded-2xl border p-4 ${
                                isOverdue
                                  ? "border-red-500/20 bg-red-500/[0.06]"
                                  : "border-orange-500/20 bg-orange-500/[0.06]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                      isOverdue
                                        ? "bg-red-500/10"
                                        : "bg-orange-500/10"
                                    }`}
                                  >
                                    <Clock3
                                      className={`h-5 w-5 ${
                                        isOverdue
                                          ? "text-red-400"
                                          : "text-orange-400"
                                      }`}
                                    />
                                  </div>

                                  <div className="min-w-0">
                                    <div
                                      className={`text-xs font-bold sm:text-sm ${
                                        isOverdue
                                          ? "text-red-300"
                                          : "text-white"
                                      }`}
                                    >
                                      {isOverdue
                                        ? "Taking longer than expected"
                                        : "Estimated preparation time"}
                                    </div>

                                    <div className="mt-1 text-[10px] text-gray-600 sm:text-xs">
                                      {isOverdue
                                        ? "The vendor is still preparing your food."
                                        : stallState.estimatedPreparationMinutes >
                                            0
                                          ? `${stallState.estimatedPreparationMinutes} min preparation`
                                          : "Preparation time unavailable"}
                                    </div>
                                  </div>
                                </div>

                                {!isOverdue &&
                                  remaining !==
                                    null && (
                                    <div className="shrink-0 font-mono text-xl font-black tracking-tight text-orange-400 sm:text-2xl">
                                      {formatCountdown(
                                        remaining
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* =================================================
                            STALL TIMELINE
                        ================================================= */}

                        <div className="border-t border-white/5 px-4 py-5 sm:px-5">
                          <div className="relative">
                            <div className="absolute left-5 right-5 top-4 h-[2px] bg-white/10" />

                            <div
                              className="absolute left-5 top-4 h-[2px] bg-orange-500 transition-all duration-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    currentRank /
                                      (STATUS_ORDER.length -
                                        1) *
                                      100
                                  )
                                )}%`,
                              }}
                            />

                            <div className="relative grid grid-cols-5 gap-1">
                              {STATUS_ORDER.map(
                                (
                                  status,
                                  index
                                ) => {
                                  const completed =
                                    currentRank >
                                    index;

                                  const active =
                                    currentRank ===
                                    index;

                                  return (
                                    <div
                                      key={
                                        status
                                      }
                                      className="flex min-w-0 flex-col items-center"
                                    >
                                      <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                                          completed ||
                                          isReady
                                            ? "border-orange-500 bg-orange-500 text-black"
                                            : active
                                              ? "border-orange-400 bg-orange-500/10 text-orange-400"
                                              : "border-white/10 bg-[#181b1e] text-gray-700"
                                        }`}
                                      >
                                        {completed ||
                                        isReady ? (
                                          <Check className="h-3.5 w-3.5" />
                                        ) : (
                                          <span className="text-[9px] font-bold">
                                            {index +
                                              1}
                                          </span>
                                        )}
                                      </div>

                                      <span
                                        className={`mt-2 text-center text-[8px] font-medium leading-tight sm:text-[9px] ${
                                          active ||
                                          completed ||
                                          isReady
                                            ? "text-gray-300"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {status ===
                                        "Ready For Pickup"
                                          ? "Ready"
                                          : status}
                                      </span>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>

                          {/* =================================================
                              STALL ITEMS
                          ================================================= */}

                          <div className="mt-5 space-y-2">
                            {stallItems.map(
                              (
                                item,
                                index
                              ) => {
                                const itemCancelled =
                                  isCancelledItem(
                                    item
                                  );

                                return (
                                  <div
                                    key={`${item.name}-${index}`}
                                    className={`flex items-center gap-3 rounded-2xl border p-2.5 transition-all ${
                                      itemCancelled
                                        ? "border-white/5 bg-black opacity-55"
                                        : "border-white/5 bg-[#17191c]"
                                    }`}
                                  >
                                    {/* Item image */}
                                    <div
                                      className={`h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#202327] ${
                                        itemCancelled
                                          ? "grayscale brightness-[0.25]"
                                          : ""
                                      }`}
                                    >
                                      {item.image ? (
                                        <img
                                          src={getImageUrl(
                                            item.image
                                          )}
                                          alt={
                                            item.name
                                          }
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          <UtensilsCrossed
                                            className={`h-5 w-5 ${
                                              itemCancelled
                                                ? "text-gray-800"
                                                : "text-gray-700"
                                            }`}
                                          />
                                        </div>
                                      )}
                                    </div>

                                    {/* Item information */}
                                    <div className="min-w-0 flex-1">
                                      <div
                                        className={`truncate text-xs font-bold sm:text-sm ${
                                          itemCancelled
                                            ? "text-gray-600 line-through"
                                            : "text-white"
                                        }`}
                                      >
                                        {
                                          item.name
                                        }
                                      </div>

                                      <div
                                        className={`mt-1 text-[10px] sm:text-xs ${
                                          itemCancelled
                                            ? "text-gray-800"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        Qty{" "}
                                        {
                                          item.quantity
                                        }
                                      </div>

                                      {itemCancelled && (
                                        <div className="mt-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-gray-700 sm:text-[10px]">
                                          <XCircle className="h-3 w-3" />
                                          Cancelled
                                        </div>
                                      )}

                                      {itemCancelled &&
                                        getItemCancellationReason(
                                          item
                                        ) && (
                                          <div className="mt-1 truncate text-[9px] text-gray-800">
                                            {
                                              getItemCancellationReason(
                                                item
                                              )
                                            }
                                          </div>
                                        )}
                                    </div>

                                    {/* Price / cancellation */}
                                    <div className="shrink-0 text-right">
                                      <div
                                        className={`text-xs font-black sm:text-sm ${
                                          itemCancelled
                                            ? "text-gray-700 line-through"
                                            : "text-orange-400"
                                        }`}
                                      >
                                        ₹
                                        {(
                                          Number(
                                            item.price ||
                                              0
                                          ) *
                                          Number(
                                            item.quantity ||
                                              0
                                          )
                                        ).toFixed(
                                          0
                                        )}
                                      </div>

                                      {itemCancelled && (
                                        <div className="mt-1 text-[9px] font-bold text-gray-700">
                                          Cancelled
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </section>

          {/* =====================================================
              CANCELLED ITEMS SUMMARY
          ===================================================== */}

          {cancelledItemCount > 0 &&
            !order.cancelled && (
              <div className="mt-6 rounded-2xl border border-white/5 bg-[#0c0e10] px-4 py-3 text-center">
                <div className="text-xs font-bold text-gray-500">
                  {cancelledItemCount} item
                  {cancelledItemCount !==
                  1
                    ? "s"
                    : ""}{" "}
                  cancelled
                </div>

                <div className="mt-1 text-[10px] text-gray-700">
                  Other active items continue to be prepared normally.
                </div>
              </div>
            )}

          {/* =====================================================
              LIVE STATUS
          ===================================================== */}

          <div className="mt-6 flex items-center justify-center gap-2 pb-2 text-[10px] text-gray-600 sm:text-xs">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                order.cancelled
                  ? "bg-gray-700"
                  : "animate-pulse bg-emerald-500"
              }`}
            />

            {order.cancelled
              ? "Order cancelled"
              : cancelledItemCount >
                  0
                ? `${cancelledItemCount} item${
                    cancelledItemCount !==
                    1
                      ? "s"
                      : ""
                  } cancelled`
                : "Live order updates enabled"}
          </div>
        </div>
      </main>
    </>
  );
}