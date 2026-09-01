"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Download,
  ShoppingBag,
  Calendar,
  CreditCard,
  Hash,
} from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from "@/components/layout/Navbar";

// Shape of the order object stored in localStorage as "latestOrder"
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
  items?: {
    name: string;
    price: number;
    quantity: number;
  }[];
}

/**
 * Formats the order's stored date string into a friendlier display format.
 * Falls back to the raw string if it can't be parsed (e.g. backend value
 * was malformed or missing), so we never show "Invalid Date" to the user.
 */
function formatOrderDate(rawDate?: string): string {
  if (!rawDate) return "Not Available";

  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) {
    return rawDate; // couldn't parse, show original string as-is
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

/**
 * Builds a one-page tax-invoice-style PDF from an order object and
 * triggers a browser download. Runs entirely client-side.
 */
function generateInvoicePDF(order: InvoiceOrder) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  const invoiceNo = `INV-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${order.token ?? "N/A"}`;

  // ---------- HEADER ----------
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(234, 88, 12); // orange-600
  doc.text("CampusVita", marginX, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Smart Campus Food Ordering", marginX, 66);
  doc.text("Email: support@campusvita.com", marginX, 80);
  
  // ✅ FIXED: Shows customer's actual phone number
  doc.text(`Phone: ${order.phone || "N/A"}`, marginX, 94);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20);
  doc.text("INVOICE", pageWidth - marginX, 50, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Invoice No: ${invoiceNo}`, pageWidth - marginX, 66, {
    align: "right",
  });
  doc.text(`Order Token: #${order.token ?? "N/A"}`, pageWidth - marginX, 80, {
    align: "right",
  });
  doc.text(`Date: ${formatOrderDate(order.date)}`, pageWidth - marginX, 94, {
    align: "right",
  });

  doc.setDrawColor(230);
  doc.line(marginX, 110, pageWidth - marginX, 110);

  // ---------- CUSTOMER + PAYMENT DETAILS ----------
  let y = 134;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20);
  doc.text("Billed To", marginX, y);
  doc.text("Payment Details", marginX + 280, y);

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
    `Payment ID: ${order.payment_id ?? "Not Available"}`,
    `Razorpay Order ID: ${order.razorpay_order_id ?? "Not Available"}`,
    `Method: ${order.payment_method ?? "ONLINE"}`,
    `Status: ${order.payment_status ?? "Paid"}`,
  ];

  const lineHeight = 14;
  billedToLines.forEach((line, i) => {
    doc.text(line, marginX, y + i * lineHeight);
  });
  paymentLines.forEach((line, i) => {
    doc.text(line, marginX + 280, y + i * lineHeight);
  });

  y += billedToLines.length * lineHeight + 20;

  // ---------- ITEMS TABLE ----------
  const rows =
    order.items && order.items.length > 0
      ? order.items.map((item) => {
          const price = Number(item.price) || 0;
          const qty = Number(item.quantity) || 0;
          return [
            item.name,
            String(qty),
            `Rs. ${price.toFixed(2)}`,
            `Rs. ${(price * qty).toFixed(2)}`,
          ];
        })
      : [["No items found", "-", "-", "-"]];

  autoTable(doc, {
    startY: y,
    head: [["Item", "Qty", "Unit Price", "Amount"]],
    body: rows,
    theme: "grid",
    headStyles: {
      fillColor: [234, 88, 12], // orange-600
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 6,
    },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: marginX, right: marginX },
  });

  // ---------- TOTAL ----------
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20);
  doc.text(
    `Total Paid: Rs. ${Number(order.total ?? 0).toFixed(2)}`,
    pageWidth - marginX,
    finalY,
    { align: "right" }
  );

  // ---------- PICKUP INFO ----------
  const pickupY = finalY + 34;

  doc.setDrawColor(234, 88, 12);
  doc.setFillColor(255, 247, 237); // orange-50
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
  doc.setTextColor(120, 53, 15); // orange-900
  doc.text(
    `Pickup Code: ${order.pickup_code || "Generating..."}`,
    marginX + 14,
    pickupY + 6
  );
  doc.text(
    `Estimated Time: ${order.estimated_time ?? "Not Available"}`,
    marginX + 14,
    pickupY + 22
  );

  // ---------- FOOTER ----------
  const footerY = pickupY + 70;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text("Thank you for ordering with CampusVita!", pageWidth / 2, footerY, {
    align: "center",
  });

  const today = new Date().toISOString().slice(0, 10);
  doc.save(`CampusVita-Invoice-${today}-${order.token ?? "order"}.pdf`);
}

export default function PaymentSuccessPage() {
  const router = useRouter();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Get order from localStorage.
    // This page is display-only — it must not mutate app state
    // (like the cart). The cart should already be cleared right
    // after payment verification succeeds, in handleVerifyPayment().
    const orderData = localStorage.getItem("latestOrder");

    if (orderData) {
      try {
        const parsedOrder = JSON.parse(orderData);
        setOrder(parsedOrder);
      } catch (error) {
        console.error("Error parsing order:", error);
        toast.error("Failed to load order details");
      }
    } else {
      // If no order found, redirect to home
      toast.error("No order found");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleTrackOrder = () => {
    router.push("/track-order");
  };

  const handleDownloadInvoice = () => {
    if (!order) {
      toast.error("No order found");
      return;
    }

    setDownloading(true);
    try {
      generateInvoicePDF(order);
      toast.success("Invoice downloaded successfully! 📄");
    } catch (error) {
      console.error("Invoice generation error:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar/>
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-orange-500 border-solid mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading order details...</p>
          </div>
        </main>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar/>
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-400">No order found. Please try again.</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 bg-orange-500 px-6 py-3 rounded-2xl hover:bg-orange-600 transition-all"
            >
              Go to Home
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar/>
      <main className="min-h-screen bg-black text-white p-6 md:p-10">
        <div className="max-w-2xl mx-auto">
          {/* SUCCESS CARD */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-10 text-center">
            {/* SUCCESS ICON */}
            <div className="flex justify-center mb-6">
              <div className="bg-green-500/20 p-4 rounded-full">
                <CheckCircle size={64} className="text-green-500" />
              </div>
            </div>

            {/* TITLE */}
            <h1 className="text-3xl md:text-4xl font-bold text-green-500">
              Payment Successful! 🎉
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              Thank you for ordering with CampusVita.
            </p>
            <p className="text-gray-400 mt-1">
              We&apos;ve received your payment and your food is being
              prepared. Track your order using the token below.
            </p>

            {/* DIVIDER */}
            <div className="border-t border-zinc-800 my-8"></div>

            {/* ORDER DETAILS */}
            <div className="text-left space-y-4">
              {/* PAYMENT ID */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Hash size={20} className="text-orange-500" />
                  <span className="text-gray-400">Payment ID</span>
                </div>
                <span className="font-mono text-sm text-white">
                  {order.payment_id ?? "Not Available"}
                </span>
              </div>

              {/* ORDER ID */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Hash size={20} className="text-orange-500" />
                  <span className="text-gray-400">Order ID</span>
                </div>
                <span className="font-mono text-sm text-white">
                  {order.razorpay_order_id ?? "Not Available"}
                </span>
              </div>

              {/* PAYMENT STATUS */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-orange-500" />
                  <span className="text-gray-400">Payment Status</span>
                </div>
                <span className="text-green-500 font-bold">
                  {(order.payment_status ?? "Paid").toLowerCase() === "paid"
                    ? "✔ Paid"
                    : order.payment_status}
                </span>
              </div>

              {/* AMOUNT PAID */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-orange-500" />
                  <span className="text-gray-400">Amount Paid</span>
                </div>
                <span className="font-bold text-xl text-orange-500">
                  ₹{Number(order.total ?? 0).toFixed(2)}
                </span>
              </div>

              {/* PAYMENT METHOD */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CreditCard size={20} className="text-orange-500" />
                  <span className="text-gray-400">Payment Method</span>
                </div>
                <span className="text-white font-medium">
                  {order.payment_method || "ONLINE"}
                </span>
              </div>

              {/* DATE */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-orange-500" />
                  <span className="text-gray-400">Date</span>
                </div>
                <span className="text-white">
                  {formatOrderDate(order.date)}
                </span>
              </div>

              {/* TOKEN */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Hash size={20} className="text-orange-500" />
                  <span className="text-gray-400">Token</span>
                </div>
                <span className="font-bold text-white">
                  #{order.token ?? "N/A"}
                </span>
              </div>

              {/* ESTIMATED TIME */}
              <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Calendar size={20} className="text-orange-500" />
                  <span className="text-gray-400">Estimated Time</span>
                </div>
                <span className="text-white font-medium">
                  {order.estimated_time ?? "Not Available"}
                </span>
              </div>

              {/* PICKUP CODE */}
              <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/40 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Hash size={22} className="text-orange-500" />
                  <span className="text-orange-400 font-medium">
                    Pickup Code
                  </span>
                </div>
                <span className="font-mono font-extrabold text-2xl tracking-widest text-orange-500">
                  {order.pickup_code || "Generating..."}
                </span>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-zinc-800 my-8"></div>

            {/* ORDER SUMMARY */}
            <div className="text-left">
              <h3 className="text-lg font-bold mb-3">Order Summary</h3>
              {order.items?.length ? (
                order.items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between py-2 border-b border-zinc-800"
                  >
                    <span className="text-gray-300">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="text-white">
                      ₹
                      {(Number(item.price) * Number(item.quantity)).toFixed(
                        2
                      )}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No items found.</p>
              )}
              <div className="flex justify-between pt-3 font-bold text-lg">
                <span>Total</span>
                <span className="text-orange-500">
                  ₹{Number(order.total ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-zinc-800 my-8"></div>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* TRACK ORDER BUTTON */}
              <button
                onClick={handleTrackOrder}
                className="flex-1 bg-orange-500 hover:bg-orange-600 transition-all py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag size={22} />
                Track Order
              </button>

              {/* DOWNLOAD INVOICE BUTTON */}
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="flex-1 border border-orange-500 text-orange-500 hover:bg-orange-500/10 transition-all py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download size={22} />
                {downloading ? "Generating..." : "Download Invoice"}
              </button>
            </div>
          </div>

          {/* BACK TO HOME */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-white transition-all"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </main>
    </>
  );
}