"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Home,
  ShoppingBag,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Navbar from "@/components/layout/Navbar";
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
   INVOICE
   ============================================================ */

function generateInvoicePDF(order: InvoiceOrder) {
  const doc = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  const invoiceNo = `INV-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${order.token ?? "N/A"}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(234, 88, 12);
  doc.text("CampusVita", marginX, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);

  doc.text(
    "Smart Campus Food Ordering",
    marginX,
    66
  );

  doc.text(
    "Email: support@campusvita.com",
    marginX,
    80
  );

  doc.text(
    `Phone: ${order.phone || "N/A"}`,
    marginX,
    94
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);

  doc.text(
    "INVOICE",
    pageWidth - marginX,
    50,
    { align: "right" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);

  doc.text(
    `Invoice No: ${invoiceNo}`,
    pageWidth - marginX,
    66,
    { align: "right" }
  );

  doc.text(
    `Order Token: #${order.token ?? "N/A"}`,
    pageWidth - marginX,
    80,
    { align: "right" }
  );

  doc.text(
    `Date: ${formatOrderDate(order.date)}`,
    pageWidth - marginX,
    94,
    { align: "right" }
  );

  doc.setDrawColor(230);
  doc.line(
    marginX,
    110,
    pageWidth - marginX,
    110
  );

  let y = 134;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20);

  doc.text("Billed To", marginX, y);
  doc.text(
    "Payment Details",
    marginX + 280,
    y
  );

  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80);

  const billedToLines = [
    order.name || "N/A",
    order.phone || "N/A",
    order.location || "N/A",
    order.email || "N/A",
  ];

  const paymentLines = [
    `Payment ID: ${
      order.payment_id ?? "Not Available"
    }`,
    `Razorpay Order ID: ${
      order.razorpay_order_id ??
      "Not Available"
    }`,
    `Method: ${
      order.payment_method ?? "ONLINE"
    }`,
    `Status: ${
      order.payment_status ?? "Paid"
    }`,
  ];

  const lineHeight = 14;

  billedToLines.forEach((line, i) => {
    doc.text(
      line,
      marginX,
      y + i * lineHeight
    );
  });

  paymentLines.forEach((line, i) => {
    doc.text(
      line,
      marginX + 280,
      y + i * lineHeight
    );
  });

  y +=
    billedToLines.length *
      lineHeight +
    20;

  const rows =
    order.items && order.items.length > 0
      ? order.items.map((item) => {
          const price =
            Number(item.price) || 0;

          const qty =
            Number(item.quantity) || 0;

          return [
            item.name,
            String(qty),
            `Rs. ${price.toFixed(2)}`,
            `Rs. ${(price * qty).toFixed(
              2
            )}`,
          ];
        })
      : [["No items found", "-", "-", "-"]];

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Item",
        "Qty",
        "Unit Price",
        "Amount",
      ],
    ],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
    columnStyles: {
      1: {
        halign: "center",
      },
      2: {
        halign: "right",
      },
      3: {
        halign: "right",
      },
    },
    margin: {
      left: marginX,
      right: marginX,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY =
    (doc as any).lastAutoTable.finalY +
    20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);

  doc.text(
    `Total Paid: Rs. ${Number(
      order.total ?? 0
    ).toFixed(2)}`,
    pageWidth - marginX,
    finalY,
    { align: "right" }
  );

  const pickupY = finalY + 34;

  doc.setDrawColor(234, 88, 12);
  doc.setFillColor(255, 247, 237);

  doc.roundedRect(
    marginX,
    pickupY - 16,
    pageWidth - marginX * 2,
    46,
    6,
    6,
    "FD"
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 53, 15);

  doc.text(
    `Pickup Code: ${
      order.pickup_code ||
      "Generating..."
    }`,
    marginX + 14,
    pickupY + 6
  );

  doc.text(
    `Estimated Time: ${
      order.estimated_time ??
      "Not Available"
    }`,
    marginX + 14,
    pickupY + 22
  );

  const footerY = pickupY + 70;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(140);

  doc.text(
    "Thank you for ordering with CampusVita!",
    pageWidth / 2,
    footerY,
    { align: "center" }
  );

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  doc.save(
    `CampusVita-Invoice-${today}-${order.token ?? "order"}.pdf`
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

  const [downloading, setDownloading] =
    useState(false);

  const [stalls, setStalls] =
    useState<Stall[]>([]);

  /* ----------------------------------------------------------
     LOAD ORDER
  ---------------------------------------------------------- */

  useEffect(() => {
    const orderData =
      localStorage.getItem(
        "latestOrder"
      );

    if (!orderData) {
      toast.error("No order found");

      setTimeout(() => {
        router.push("/");
      }, 1500);

      setLoading(false);
      return;
    }

    try {
      const parsedOrder =
        JSON.parse(orderData);

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
  }, [router]);

  /* ----------------------------------------------------------
     LOAD REAL STALL DATA
  ---------------------------------------------------------- */

  useEffect(() => {
    if (!order?.items?.length) {
      return;
    }

    const loadStalls = async () => {
      try {
        const response =
          await fetch(
            `${API_URL}/stalls`
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        const stallList =
          Array.isArray(data)
            ? data
            : data?.stalls;

        if (
          Array.isArray(stallList)
        ) {
          setStalls(stallList);
        }
      } catch (error) {
        console.error(
          "Failed to load stalls:",
          error
        );
      }
    };

    loadStalls();
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
              (s) =>
                String(
                  s._id ||
                    s.id ||
                    ""
                ) === stallId
            );

          const existing =
            groups.get(stallId);

          if (existing) {
            existing.items.push(
              item
            );

            existing.subtotal +=
              Number(item.price) *
              Number(item.quantity);

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
              Number(item.price) *
              Number(item.quantity),
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

  const handleTrackOrder =
    () => {
      router.push(
        "/track-order"
      );
    };

  const handleDownloadInvoice =
    () => {
      if (!order) {
        toast.error(
          "No order found"
        );
        return;
      }

      setDownloading(true);

      try {
        generateInvoicePDF(
          order
        );

        toast.success(
          "Invoice downloaded successfully"
        );
      } catch (error) {
        console.error(
          "Invoice generation error:",
          error
        );

        toast.error(
          "Failed to generate invoice"
        );
      } finally {
        setDownloading(false);
      }
    };

  /* ----------------------------------------------------------
     LOADING
  ---------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full border-2 border-zinc-800 border-t-orange-500 animate-spin" />

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
        <Navbar />

        <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-zinc-400">
              No order found.
            </p>

            <button
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

  const total =
    Number(order.total ?? 0);

  const totalItems =
    order.items?.reduce(
      (sum, item) =>
        sum +
        Number(item.quantity),
      0
    ) ?? 0;

  /* ----------------------------------------------------------
     MAIN UI
  ---------------------------------------------------------- */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white px-4 pb-28 pt-6 sm:px-6 md:px-8">
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
                  (group) => (
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
                              <img
                                src={getImageUrl(
                                  group.stallImage
                                )}
                                alt={
                                  group.stallName
                                }
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
                              {group.stallName}
                            </h3>

                            <p className="text-xs text-zinc-500 sm:text-sm">
                              {group.items.reduce(
                                (
                                  sum,
                                  item
                                ) =>
                                  sum +
                                  Number(
                                    item.quantity
                                  ),
                                0
                              )}{" "}
                              {group.items.reduce(
                                (
                                  sum,
                                  item
                                ) =>
                                  sum +
                                  Number(
                                    item.quantity
                                  ),
                                0
                              ) === 1
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
                                    <ShoppingBag
                                      size={20}
                                      className="text-zinc-500"
                                    />
                                  </div>
                                )}

                              </div>

                              <div className="min-w-0 flex-1">

                                <p className="truncate text-sm font-semibold text-white sm:text-base">
                                  {item.name}
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
                  )
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
              PICKUP INFORMATION
          ================================================== */}

          <section className="mt-5 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-5 sm:p-6">

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-orange-400/70">
                  Pickup Code
                </p>

                <p className="mt-1 font-mono text-2xl font-extrabold tracking-widest text-orange-500">
                  {order.pickup_code ||
                    "Generating..."}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-orange-400/70">
                  Estimated Time
                </p>

                <p className="mt-1 text-base font-semibold text-white">
                  {order.estimated_time ||
                    "Not Available"}
                </p>
              </div>

            </div>

          </section>

          {/* ==================================================
              ACTION BUTTONS
          ================================================== */}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">

            <button
              onClick={handleTrackOrder}
              className="group flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-base font-bold text-white transition hover:bg-orange-600 active:scale-[0.99]"
            >
              <ShoppingBag
                size={21}
              />

              Track Order

              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>

            <button
              onClick={
                handleDownloadInvoice
              }
              disabled={downloading}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-base font-bold text-white transition hover:border-orange-500 hover:text-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download
                size={20}
              />

              {downloading
                ? "Generating..."
                : "Download Invoice"}
            </button>

          </div>

          {/* ==================================================
              HOME
          ================================================== */}

          <button
            onClick={() =>
              router.push("/")
            }
            className="mx-auto mt-6 flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-white"
          >
            <Home size={17} />

            Back to Home
          </button>

        </div>
      </main>
    </>
  );
}