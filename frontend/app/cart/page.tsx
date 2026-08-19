"use client";

import Script from "next/script";
import toast from "react-hot-toast";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  CreditCard,
  Loader2,
  LockKeyhole,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import { getImageUrl } from "@/app/lib/getImageUrl";
import { useCart } from "../../context/CartContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentMethod = "ONLINE" | "WALLET";

type Profile = {
  name: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  profile_image: string;
  notifications: boolean;
  theme: string;
  favorite_foods: string[];
  wallet: number;
};

type BillSummary = {
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount: number;
  total: number;
};

export default function CartPage() {
  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const router = useRouter();

  /*
   * ------------------------------------------------------------
   * STATE
   * ------------------------------------------------------------
   */

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [bill, setBill] =
    useState<BillSummary | null>(null);

  const [billLoading, setBillLoading] =
    useState(false);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("ONLINE");

  const [paymentSheetOpen, setPaymentSheetOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  /*
   * Prevent duplicate order/payment requests.
   */
  const actionLock = useRef(false);

  /*
   * ------------------------------------------------------------
   * LOAD PROFILE
   * ------------------------------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token =
        localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setProfileLoading(true);

        const response = await fetch(
          `${API_URL}/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          localStorage.removeItem(
            "access_token"
          );

          router.replace("/login");
          return;
        }

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            errorData?.detail ||
              "Failed to load profile"
          );
        }

        const data =
          await response.json();

        if (cancelled) return;

        const liveProfile: Profile = {
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          department:
            data.department ?? "",
          year: data.year ?? "",
          profile_image:
            data.profile_image ?? "",
          notifications:
            data.notifications ?? true,
          theme:
            data.theme ?? "dark",
          favorite_foods:
            Array.isArray(
              data.favorite_foods
            )
              ? data.favorite_foods
              : [],
          wallet: Number(
            data.wallet ?? 0
          ),
        };

        setProfile(liveProfile);
      } catch (error) {
        console.error(
          "Profile error:",
          error
        );

        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to load profile details"
          );
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  /*
   * ------------------------------------------------------------
   * LOAD SERVER-AUTHORITATIVE BILL
   * ------------------------------------------------------------
   *
   * Every time the cart changes, the backend recalculates:
   *
   * subtotal
   * + fees
   * + taxes
   * - discounts
   * = final total
   *
   * The frontend does NOT decide the final payable amount.
   */

  useEffect(() => {
    let cancelled = false;

    async function loadBill() {
      if (cartItems.length === 0) {
        setBill(null);
        setBillLoading(false);
        return;
      }

      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setBillLoading(true);

        const response = await fetch(
          `${API_URL}/cart/summary`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              items: cartItems.map(
                (item) => ({
                  name: item.name,

                  quantity:
                    Number(
                      item.quantity
                    ),
                })
              ),
            }),

            cache: "no-store",
          }
        );

        if (!response.ok) {
          const error =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            error?.detail ||
              "Failed to calculate cart total"
          );
        }

        const data =
          await response.json();

        if (cancelled) return;

        setBill({
          subtotal:
            Number(
              data.subtotal ?? 0
            ),

          delivery_fee:
            Number(
              data.delivery_fee ?? 0
            ),

          tax_amount:
            Number(
              data.tax_amount ?? 0
            ),

          discount:
            Number(
              data.discount ?? 0
            ),

          total:
            Number(
              data.total ?? 0
            ),
        });
      } catch (error) {
        console.error(
          "Cart summary error:",
          error
        );

        if (!cancelled) {
          setBill(null);

          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to calculate total"
          );
        }
      } finally {
        if (!cancelled) {
          setBillLoading(false);
        }
      }
    }

    loadBill();

    return () => {
      cancelled = true;
    };
  }, [cartItems, router]);

  /*
   * ------------------------------------------------------------
   * PAYMENT HELPERS
   * ------------------------------------------------------------
   */

  const walletBalance =
    Number(profile?.wallet ?? 0);

  const total =
    Number(bill?.total ?? 0);

  const walletCanPay =
    walletBalance >= total;

  const paymentLabel =
    paymentMethod === "WALLET"
      ? "CampusVita Wallet"
      : "Online Payment";

  /*
   * ------------------------------------------------------------
   * LOCK HELPERS
   * ------------------------------------------------------------
   */

  const acquireLock = () => {
    if (actionLock.current) {
      return false;
    }

    actionLock.current = true;
    setLoading(true);

    return true;
  };

  const releaseLock = () => {
    actionLock.current = false;
    setLoading(false);
  };

  /*
   * ------------------------------------------------------------
   * WAIT FOR RAZORPAY
   * ------------------------------------------------------------
   */

  const waitForRazorpay =
    async (): Promise<boolean> => {
      if (window.Razorpay) {
        return true;
      }

      return new Promise(
        (resolve) => {
          const started =
            Date.now();

          const timer =
            window.setInterval(() => {
              if (window.Razorpay) {
                window.clearInterval(
                  timer
                );

                resolve(true);
                return;
              }

              if (
                Date.now() -
                  started >
                10000
              ) {
                window.clearInterval(
                  timer
                );

                resolve(false);
              }
            }, 100);
        }
      );
    };

  /*
   * ------------------------------------------------------------
   * VERIFY RAZORPAY PAYMENT
   * ------------------------------------------------------------
   *
   * IMPORTANT:
   * The frontend never marks the order as paid.
   *
   * Your FastAPI /verify-payment endpoint verifies the
   * Razorpay signature and creates the real order/payment.
   */

  const verifyPayment =
    async (
      paymentResponse: any,
      orderIntent: string
    ) => {
      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          toast.error(
            "Please login again"
          );

          router.replace("/login");
          return;
        }

        const response =
          await fetch(
            `${API_URL}/verify-payment`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,

                razorpay_order_id:
                  paymentResponse.razorpay_order_id,

                razorpay_signature:
                  paymentResponse.razorpay_signature,

                order_intent:
                  orderIntent,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Payment verification failed"
          );
        }

        if (!data.success) {
          throw new Error(
            data?.message ||
              "Payment verification failed"
          );
        }

        /*
         * ONLY after backend verification:
         * save order/payment information.
         */

        localStorage.setItem(
          "latestOrder",
          JSON.stringify(
            data.order
          )
        );

        localStorage.setItem(
          "latestPayment",
          JSON.stringify({
            paymentId:
              data.payment_id,

            orderId:
              data.order?._id ||
              data.order?.order_id ||
              paymentResponse.razorpay_order_id,

            amount:
              data.order?.total ??
              bill?.total ??
              0,

            method: "ONLINE",
          })
        );

        /*
         * Clear cart ONLY after successful
         * backend payment verification.
         */

        clearCart();

        setPaymentSheetOpen(false);

        toast.success(
          "Payment verified successfully"
        );

        router.push(
          "/payment-success"
        );
      } catch (error) {
        /*
         * DO NOT clear cart here.
         */

        console.error(
          "Payment verification error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Payment verification failed. Your cart is safe."
        );
      } finally {
        releaseLock();
      }
    };

  /*
   * ------------------------------------------------------------
   * ONLINE PAYMENT
   * ------------------------------------------------------------
   */

  const handleOnlinePayment =
    async () => {
      if (!profile) {
        toast.error(
          "Loading profile details..."
        );

        return;
      }

      if (!bill) {
        toast.error(
          "Calculating final amount..."
        );

        return;
      }

      if (bill.total <= 0) {
        toast.error(
          "Invalid order amount"
        );

        return;
      }

      if (!acquireLock()) {
        return;
      }

      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          router.replace("/login");

          releaseLock();

          return;
        }

        /*
         * IMPORTANT:
         *
         * We intentionally do NOT send the frontend
         * calculated total to the backend.
         *
         * The backend recalculates the real amount.
         */

        const response =
          await fetch(
            `${API_URL}/create-razorpay-order`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                items: cartItems.map(
                  (item) => ({
                    name: item.name,

                    quantity:
                      Number(
                        item.quantity
                      ),
                  })
                ),

                name:
                  profile.name,

                phone:
                  profile.phone,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Failed to create payment"
          );
        }

        if (!data.success) {
          throw new Error(
            data?.message ||
              "Failed to create payment"
          );
        }

        const razorpayReady =
          await waitForRazorpay();

        if (!razorpayReady) {
          throw new Error(
            "Payment gateway is unavailable. Please try again."
          );
        }

        /*
         * Razorpay amount comes from backend.
         */

        const options = {
          key: data.key,

          amount:
            data.amount,

          currency:
            data.currency || "INR",

          name: "CampusVita",

          description:
            "CampusVita Food Order",

          order_id:
            data.order_id,

          prefill: {
            name:
              profile.name,

            email:
              profile.email,

            contact:
              profile.phone,
          },

          theme: {
            color: "#f97316",
          },

          handler:
            async function (
              paymentResponse: any
            ) {
              await verifyPayment(
                paymentResponse,
                data.order_intent
              );
            },

          modal: {
            ondismiss:
              function () {
                toast(
                  "Payment cancelled. Your cart is safe."
                );

                releaseLock();
              },
          },
        };

        const razor =
          new window.Razorpay(
            options
          );

        razor.on(
          "payment.failed",
          function (
            response: any
          ) {
            console.error(
              "Razorpay payment failed:",
              response?.error
            );

            toast.error(
              response?.error
                ?.description ||
                "Payment failed. Your cart is safe."
            );

            releaseLock();
          }
        );

        razor.open();
      } catch (error) {
        console.error(
          "Online payment error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to start payment"
        );

        releaseLock();
      }
    };

  /*
   * ------------------------------------------------------------
   * WALLET PAYMENT
   * ------------------------------------------------------------
   *
   * The frontend checks the current profile balance only
   * for UX.
   *
   * The backend MUST remain authoritative and validate the
   * wallet balance again before deducting money.
   */

  const handleWalletPayment =
    async () => {
      if (!profile) {
        toast.error(
          "Loading wallet details..."
        );

        return;
      }

      if (!bill) {
        toast.error(
          "Calculating final amount..."
        );

        return;
      }

      if (
        walletBalance <
        bill.total
      ) {
        toast.error(
          `Insufficient wallet balance. Need ₹${bill.total.toFixed(
            0
          )} but only ₹${walletBalance.toFixed(
            0
          )} is available.`
        );

        return;
      }

      if (!acquireLock()) {
        return;
      }

      try {
        const token =
          localStorage.getItem(
            "access_token"
          );

        if (!token) {
          router.replace("/login");

          releaseLock();

          return;
        }

        /*
         * IMPORTANT:
         *
         * We do NOT send wallet balance from frontend.
         *
         * Backend must calculate the final amount,
         * validate balance and perform the transaction.
         */

        const response =
          await fetch(
            `${API_URL}/wallet/pay-order`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                items: cartItems.map(
                  (item) => ({
                    name: item.name,

                    quantity:
                      Number(
                        item.quantity
                      ),
                  })
                ),

                name:
                  profile.name,

                phone:
                  profile.phone,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Wallet payment failed"
          );
        }

        if (!data.success) {
          throw new Error(
            data?.message ||
              "Wallet payment failed"
          );
        }

        /*
         * Backend confirmed wallet payment.
         */

        localStorage.setItem(
          "latestOrder",
          JSON.stringify(
            data.order
          )
        );

        localStorage.setItem(
          "latestPayment",
          JSON.stringify({
            paymentId:
              data.payment_id ||
              null,

            orderId:
              data.order?.order_id ||
              data.order?._id ||
              null,

            amount:
              data.amount_paid ??
              bill.total,

            method: "WALLET",
          })
        );

        /*
         * Clear cart ONLY after successful
         * backend wallet payment.
         */

        clearCart();

        setPaymentSheetOpen(false);

        toast.success(
          "Order placed using CampusVita Wallet"
        );

        router.push(
          "/payment-success"
        );
      } catch (error) {
        console.error(
          "Wallet payment error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Wallet payment failed"
        );
      } finally {
        releaseLock();
      }
    };

  /*
   * ------------------------------------------------------------
   * PLACE ORDER
   * ------------------------------------------------------------
   */

  const handlePlaceOrder =
    async () => {
      if (!bill) {
        toast.error(
          "Please wait for the final amount"
        );

        return;
      }

      if (paymentMethod === "WALLET") {
        await handleWalletPayment();

        return;
      }

      await handleOnlinePayment();
    };

  /*
   * ------------------------------------------------------------
   * PAYMENT METHOD SELECTOR
   * ------------------------------------------------------------
   */

  const selectPaymentMethod = (
    method: PaymentMethod
  ) => {
    if (
      method === "WALLET" &&
      !walletCanPay
    ) {
      toast.error(
        `Insufficient wallet balance. Need ₹${total.toFixed(
          0
        )} • Available ₹${walletBalance.toFixed(
          0
        )}`
      );

      return;
    }

    setPaymentMethod(method);
  };

  /*
   * ------------------------------------------------------------
   * EMPTY CART
   * ------------------------------------------------------------
   */

  if (cartItems.length === 0) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black px-4 pb-24 pt-6 text-white">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-2xl font-bold">
              Your Cart
            </h1>

            <div className="mt-8 flex min-h-[55vh] flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10">
                <ShoppingBag
                  size={38}
                  className="text-orange-500"
                />
              </div>

              <h2 className="mt-5 text-xl font-bold">
                Your cart is empty
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Add something delicious
                from the menu.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push("/menu")
                }
                className="mt-6 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition active:scale-95"
              >
                Browse Food

                <ArrowRight
                  size={17}
                />
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  /*
   * ------------------------------------------------------------
   * MAIN CART
   * ------------------------------------------------------------
   */

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <Navbar />

      <main
        className="
          min-h-screen
          bg-black
          px-3
          pt-4
          pb-[190px]
          text-white
          sm:px-5
          md:px-8
          md:pb-[165px]
          md:pt-8
        "
      >
        <div className="mx-auto max-w-6xl">

          {/* ====================================================
              HEADER
          ==================================================== */}

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Your Cart
              </h1>

              <p className="mt-1 text-xs text-zinc-500">
                {cartItems.length}{" "}
                {cartItems.length === 1
                  ? "item"
                  : "items"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950">
              <ShoppingBag
                size={19}
                className="text-orange-500"
              />
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">

            {/* ==================================================
                LEFT / CART
            ================================================== */}

            <section>

              {/* PREPARATION CARD */}

              <div className="mb-3 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                  <Clock3
                    size={16}
                    className="text-orange-500"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold">
                    Ready for pickup
                  </p>

                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Your food will be prepared after payment
                  </p>
                </div>
              </div>

              {/* CART ITEMS */}

              <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
                {cartItems.map(
                  (
                    item,
                    index
                  ) => {
                    const itemTotal =
                      Number(
                        item.price
                      ) *
                      Number(
                        item.quantity
                      );

                    return (
                      <div
                        key={`${item.name}-${index}`}
                        className={`
                          px-3
                          py-3.5
                          sm:px-4
                          ${
                            index !==
                            cartItems.length -
                              1
                              ? "border-b border-zinc-800"
                              : ""
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">

                          {/* IMAGE */}

                          <div className="h-[64px] w-[64px] shrink-0 overflow-hidden rounded-xl bg-zinc-900">
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
                              <div className="flex h-full w-full items-center justify-center text-xl">
                                🍽️
                              </div>
                            )}
                          </div>

                          {/* INFORMATION */}

                          <div className="min-w-0 flex-1">
                            <h2 className="line-clamp-2 text-sm font-semibold leading-5">
                              {item.name}
                            </h2>

                            <p className="mt-1 text-[11px] text-zinc-500">
                              ₹
                              {Number(
                                item.price
                              ).toFixed(
                                0
                              )}{" "}
                              each
                            </p>

                            <p className="mt-1 text-sm font-bold text-orange-500">
                              ₹
                              {itemTotal.toFixed(
                                0
                              )}
                            </p>
                          </div>

                          {/* QUANTITY */}

                          <div className="flex shrink-0 items-center rounded-lg border border-zinc-700 bg-zinc-900">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name}`}
                              onClick={() =>
                                decreaseQuantity(
                                  item.name
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center text-zinc-300 transition active:scale-90"
                            >
                              <Minus
                                size={14}
                              />
                            </button>

                            <span className="flex h-8 min-w-7 items-center justify-center text-xs font-bold">
                              {
                                item.quantity
                              }
                            </span>

                            <button
                              type="button"
                              aria-label={`Increase ${item.name}`}
                              onClick={() =>
                                increaseQuantity(
                                  item.name
                                )
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-white transition active:scale-90"
                            >
                              <Plus
                                size={14}
                              />
                            </button>
                          </div>
                        </div>

                        {/* REMOVE */}

                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              removeItem(
                                item.name
                              );

                              toast.success(
                                `${item.name} removed`
                              );
                            }}
                            className="flex items-center gap-1 rounded-md px-1 py-1 text-[11px] text-zinc-500 transition hover:text-red-400"
                          >
                            <Trash2
                              size={12}
                            />

                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {/* ADD MORE ITEMS */}

              <button
                type="button"
                onClick={() =>
                  router.push("/")
                }
                className="
                  mt-3
                  flex
                  w-full
                  items-center
                  justify-between
                  rounded-xl
                  border
                  border-dashed
                  border-zinc-700
                  bg-zinc-950
                  px-4
                  py-3.5
                  text-left
                  transition-all
                  duration-200
                  hover:border-orange-500
                  hover:bg-zinc-900
                  active:scale-[0.99]
                "
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Add more items
                  </p>

                  <p className="mt-0.5 text-xs text-zinc-500">
                    Explore more food from CampusVita
                  </p>
                </div>

                <ChevronRight
                  size={18}
                  className="shrink-0 text-orange-500"
                />
              </button>
            </section>

            {/* ==================================================
                BILL SUMMARY
            ================================================== */}

            <aside className="h-fit">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold">
                    Bill Summary
                  </h2>

                  <span className="text-xs text-zinc-500">
                    {cartItems.length}{" "}
                    {cartItems.length === 1
                      ? "item"
                      : "items"}
                  </span>
                </div>

                {billLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2
                      size={22}
                      className="animate-spin text-orange-500"
                    />
                  </div>
                ) : bill ? (
                  <>
                    <div className="space-y-3 text-sm">

                      <div className="flex justify-between">
                        <span className="text-zinc-500">
                          Subtotal
                        </span>

                        <span>
                          ₹
                          {bill.subtotal.toFixed(
                            0
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-zinc-500">
                          Delivery Fee
                        </span>

                        <span>
                          ₹
                          {bill.delivery_fee.toFixed(
                            0
                          )}
                        </span>
                      </div>

                      {bill.tax_amount >
                        0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">
                            Taxes & Charges
                          </span>

                          <span>
                            ₹
                            {bill.tax_amount.toFixed(
                              0
                            )}
                          </span>
                        </div>
                      )}

                      {bill.discount >
                        0 && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">
                            Discount
                          </span>

                          <span className="text-green-400">
                            -₹
                            {bill.discount.toFixed(
                              0
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="my-4 border-t border-dashed border-zinc-800" />

                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        Total
                      </span>

                      <span className="text-xl font-bold text-orange-500">
                        ₹
                        {bill.total.toFixed(
                          0
                        )}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2.5">
                      <LockKeyhole
                        size={12}
                        className="text-zinc-500"
                      />

                      <p className="text-[11px] text-zinc-500">
                        Secure payment
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="py-6 text-center text-xs text-red-400">
                    Unable to calculate total
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* ========================================================
          STICKY CHECKOUT BAR
      ======================================================== */}

      <div
        className="
          fixed
          inset-x-0
          bottom-16
          z-[60]
          border-t
          border-zinc-800
          bg-black/95
          px-3
          pt-2.5
          backdrop-blur-xl
          sm:px-5
          sm:pt-3
          md:bottom-0
        "
        style={{
          paddingBottom:
            "calc(0.65rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 sm:gap-3">

          {/* ====================================================
              CHANGE PAYMENT METHOD
          ==================================================== */}

          <button
            type="button"
            onClick={() =>
              setPaymentSheetOpen(
                true
              )
            }
            disabled={
              loading ||
              billLoading ||
              !bill
            }
            className="
              min-w-0
              flex-1
              rounded-xl
              px-1
              py-1
              text-left
              transition
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <p className="truncate text-[9px] font-semibold tracking-wide text-zinc-500 sm:text-[10px]">
              CHANGE METHOD
              <span className="ml-1 text-orange-500">
                →
              </span>
            </p>

            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              {paymentMethod ===
              "WALLET" ? (
                <Wallet
                  size={15}
                  className="shrink-0 text-orange-500"
                />
              ) : (
                <CreditCard
                  size={15}
                  className="shrink-0 text-orange-500"
                />
              )}

              <span className="truncate text-xs font-semibold text-white sm:text-sm">
                {paymentLabel}
              </span>
            </div>

            {paymentMethod ===
              "WALLET" && (
              <p
                className={`mt-0.5 truncate text-[9px] sm:text-[10px] ${
                  walletCanPay
                    ? "text-zinc-500"
                    : "text-red-400"
                }`}
              >
                {walletCanPay
                  ? `Balance ₹${walletBalance.toFixed(
                      0
                    )}`
                  : `Need ₹${total.toFixed(
                      0
                    )} • Available ₹${walletBalance.toFixed(
                      0
                    )}`}
              </p>
            )}
          </button>

          {/* ====================================================
              PLACE ORDER
          ==================================================== */}

          <button
            type="button"
            onClick={
              handlePlaceOrder
            }
            disabled={
              loading ||
              billLoading ||
              !bill ||
              profileLoading ||
              (paymentMethod ===
                "WALLET" &&
                !walletCanPay)
            }
            className="
              flex
              min-h-12
              flex-[1.35]
              items-center
              justify-center
              gap-1.5
              rounded-xl
              bg-orange-500
              px-3
              text-xs
              font-bold
              text-white
              shadow-lg
              shadow-orange-500/10
              transition-all
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:gap-2
              sm:px-4
              sm:text-sm
            "
          >
            {loading ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                <span>
                  Processing...
                </span>
              </>
            ) : (
              <>
                <span>
                  Place Order
                </span>

                <span className="whitespace-nowrap">
                  ₹
                  {total.toFixed(0)}
                </span>

                <ArrowRight
                  size={17}
                  className="shrink-0"
                />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          PAYMENT METHOD BOTTOM SHEET
      ======================================================== */}

      {paymentSheetOpen && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            bg-black/70
            backdrop-blur-sm
          "
          onClick={() =>
            setPaymentSheetOpen(
              false
            )
          }
        >
          <div
            className="
              absolute
              inset-x-0
              bottom-0
              max-h-[90vh]
              overflow-y-auto
              rounded-t-3xl
              border-t
              border-zinc-800
              bg-zinc-950
              p-4
              shadow-2xl
              sm:mx-auto
              sm:max-w-xl
              sm:rounded-3xl
              sm:bottom-4
            "
            style={{
              paddingBottom:
                "calc(1rem + env(safe-area-inset-bottom))",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* DRAG HANDLE */}

            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

            {/* HEADER */}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Choose Payment Method
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Select how you want to pay
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPaymentSheetOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 transition hover:bg-zinc-800 active:scale-90"
              >
                <X size={17} />
              </button>
            </div>

            {/* ==================================================
                PAYMENT OPTIONS
            ================================================== */}

            <div className="mt-5 space-y-3">

              {/* =================================================
                  CAMPUSVITA WALLET
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  selectPaymentMethod(
                    "WALLET"
                  )
                }
                disabled={
                  !walletCanPay ||
                  loading ||
                  billLoading
                }
                className={`
                  relative
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  p-3.5
                  text-left
                  transition-all
                  ${
                    paymentMethod ===
                    "WALLET"
                      ? "border-orange-500 bg-orange-500/10"
                      : walletCanPay
                      ? "border-zinc-800 bg-zinc-900"
                      : "border-zinc-800 bg-zinc-900/60"
                  }
                  ${
                    !walletCanPay
                      ? "cursor-not-allowed opacity-70"
                      : "active:scale-[0.99]"
                  }
                `}
              >
                {/* ICON */}

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                  <Wallet
                    size={20}
                    className="text-orange-500"
                  />
                </div>

                {/* CONTENT */}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">
                      CampusVita Wallet
                    </p>

                    {walletCanPay && (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-semibold text-green-400">
                        Available
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-[11px] text-zinc-500">
                    Available Balance: ₹
                    {walletBalance.toFixed(
                      2
                    )}
                  </p>

                  {!walletCanPay && (
                    <p className="mt-1 text-[10px] font-medium text-red-400">
                      Need ₹
                      {total.toFixed(
                        0
                      )}{" "}
                      • Available ₹
                      {walletBalance.toFixed(
                        0
                      )}
                    </p>
                  )}
                </div>

                {/* RADIO */}

                <div
                  className={`
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    ${
                      paymentMethod ===
                      "WALLET"
                        ? "border-orange-500"
                        : "border-zinc-600"
                    }
                  `}
                >
                  {paymentMethod ===
                    "WALLET" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  )}
                </div>
              </button>

              {/* =================================================
                  ONLINE PAYMENT
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  selectPaymentMethod(
                    "ONLINE"
                  )
                }
                disabled={
                  loading ||
                  billLoading
                }
                className={`
                  flex
                  w-full
                  items-center
                  gap-3
                  rounded-2xl
                  border
                  p-3.5
                  text-left
                  transition-all
                  ${
                    paymentMethod ===
                    "ONLINE"
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-800 bg-zinc-900"
                  }
                  active:scale-[0.99]
                `}
              >
                {/* ICON */}

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
                  <CreditCard
                    size={20}
                    className="text-orange-500"
                  />
                </div>

                {/* CONTENT */}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Online Payment
                  </p>

                  <p className="mt-1 text-[11px] text-zinc-500">
                    UPI, Cards, Net Banking & more
                  </p>

                  <p className="mt-1 text-[10px] text-zinc-600">
                    Secure checkout powered by Razorpay
                  </p>
                </div>

                {/* RADIO */}

                <div
                  className={`
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    ${
                      paymentMethod ===
                      "ONLINE"
                        ? "border-orange-500"
                        : "border-zinc-600"
                    }
                  `}
                >
                  {paymentMethod ===
                    "ONLINE" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  )}
                </div>
              </button>
            </div>

            {/* ==================================================
                PAYABLE AMOUNT
            ================================================== */}

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500">
                    Payable Amount
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {paymentLabel}
                  </p>
                </div>

                <p className="text-xl font-bold text-orange-500">
                  ₹
                  {total.toFixed(0)}
                </p>
              </div>
            </div>

            {/* ==================================================
                CONTINUE BUTTON
            ================================================== */}

            <button
              type="button"
              onClick={() =>
                setPaymentSheetOpen(
                  false
                )
              }
              disabled={
                loading ||
                billLoading ||
                !bill ||
                (paymentMethod ===
                  "WALLET" &&
                  !walletCanPay)
              }
              className="
                mt-4
                flex
                min-h-12
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-orange-500
                px-4
                text-sm
                font-bold
                text-white
                transition
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Continue with{" "}
              {paymentMethod ===
              "WALLET"
                ? "Wallet"
                : "Online Payment"}

              <ArrowRight
                size={17}
              />
            </button>

            {/* SECURITY */}

            <div className="mt-3 flex items-center justify-center gap-1.5">
              <LockKeyhole
                size={12}
                className="text-zinc-600"
              />

              <p className="text-[10px] text-zinc-600">
                Secure payment • CampusVita
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}