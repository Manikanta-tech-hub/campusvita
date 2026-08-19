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

type PaymentMethod =
  | "ONLINE"
  | "WALLET"
  | "COD";

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
   * Prevent double taps / duplicate payment initialization.
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
          throw new Error(
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

        toast.error(
          "Unable to load profile details"
        );
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
   */

  useEffect(() => {
    let cancelled = false;

    async function loadBill() {
      if (cartItems.length === 0) {
        setBill(null);
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
                    Number(item.quantity),
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
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to calculate total"
          );

          setBill(null);
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
         * ONLY backend-confirmed payment
         * reaches this point.
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
              paymentResponse.razorpay_order_id,

            amount:
              data.order?.total ??
              bill?.total ??
              0,

            method: "ONLINE",
          })
        );

        clearCart();

        toast.success(
          "Payment verified successfully"
        );

        router.push(
          "/payment-success"
        );
      } catch (error) {
        /*
         * IMPORTANT:
         * Do NOT clear the cart on
         * verification failure.
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

      if (!acquireLock()) return;

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
         * Server recalculates prices.
         * Client price is NOT trusted.
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
   */

  const handleWalletPayment =
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

      if (
        profile.wallet <
        bill.total
      ) {
        toast.error(
          "Insufficient CampusVita wallet balance"
        );

        return;
      }

      if (!acquireLock()) return;

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

        clearCart();

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
   * COD
   * ------------------------------------------------------------
   */

  const handleCOD =
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

      if (!acquireLock()) return;

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

        const response =
          await fetch(
            `${API_URL}/place-order`,
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
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              "Failed to place order"
          );
        }

        if (!data.success) {
          throw new Error(
            data?.message ||
              "Failed to place order"
          );
        }

        localStorage.setItem(
          "latestOrder",
          JSON.stringify(
            data.order
          )
        );

        clearCart();

        toast.success(
          "Order placed successfully"
        );

        router.push(
          "/payment-success"
        );
      } catch (error) {
        console.error(
          "COD error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to place order"
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
      if (
        paymentMethod ===
        "ONLINE"
      ) {
        await handleOnlinePayment();

        return;
      }

      if (
        paymentMethod ===
        "WALLET"
      ) {
        await handleWalletPayment();

        return;
      }

      await handleCOD();
    };

  /*
   * ------------------------------------------------------------
   * PAYMENT METHOD LABEL
   * ------------------------------------------------------------
   */

  const paymentLabel =
    paymentMethod ===
    "ONLINE"
      ? "Online Payment"
      : paymentMethod ===
        "WALLET"
      ? "CampusVita Wallet"
      : "Cash on Delivery";

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
                  router.push(
                    "/menu"
                  )
                }
                className="mt-6 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold"
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

  const total =
    bill?.total ?? 0;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <Navbar />

      <main className="min-h-screen bg-black px-3 pb-[145px] pt-4 text-white sm:px-5 md:px-8 md:pb-40 md:pt-8">
        <div className="mx-auto max-w-6xl">

          {/* HEADER */}

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Your Cart
              </h1>

              <p className="mt-1 text-xs text-zinc-500">
                {cartItems.length}{" "}
                {cartItems.length ===
                1
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

            {/* LEFT */}

            <section>

              {/* PREPARATION */}

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
                        className={`px-3 py-3.5 ${
                          index !==
                          cartItems.length -
                            1
                            ? "border-b border-zinc-800"
                            : ""
                        }`}
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

                          {/* INFO */}

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
                              className="flex h-8 w-8 items-center justify-center text-zinc-300 active:scale-95"
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
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-500 text-white active:scale-95"
                            >
                              <Plus
                                size={14}
                              />
                            </button>

                          </div>

                        </div>

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
                            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-red-400"
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

              {/* ADD MORE */}

              <button
  type="button"
  onClick={() => router.push("/")}
  className="mt-3 flex w-full items-center justify-between rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-4 py-3.5 text-left transition-all duration-200 hover:border-orange-500 hover:bg-zinc-900 active:scale-[0.99]"
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

            {/* BILL */}

            <aside className="h-fit">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">

                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold">
                    Bill Summary
                  </h2>

                  <span className="text-xs text-zinc-500">
                    {cartItems.length}{" "}
                    items
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
          STICKY ORDER BAR
      ======================================================== */}

      <div className="fixed inset-x-0 bottom-16 z-[60] border-t border-zinc-800 bg-black/95 px-3 py-2.5 backdrop-blur-xl sm:px-5 sm:py-3 md:bottom-0">
        <div className="mx-auto flex max-w-6xl items-center gap-3">

          <button
            type="button"
            onClick={() =>
              setPaymentSheetOpen(
                true
              )
            }
            className="min-w-0 flex-1 text-left"
          >
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Total Amount
            </p>

            <p className="text-xl font-bold text-white">
              ₹
              {bill
                ? bill.total.toFixed(
                    0
                  )
                : "—"}
            </p>
          </button>

          <button
            type="button"
            onClick={
              handlePlaceOrder
            }
            disabled={
              loading ||
              billLoading ||
              !bill ||
              profileLoading
            }
            className="flex min-h-12 flex-[1.35] items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-bold text-white shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2
                  size={17}
                  className="animate-spin"
                />

                Processing...
              </>
            ) : (
              <>
                Place Order

                <ArrowRight
                  size={17}
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
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
          onClick={() =>
            setPaymentSheetOpen(
              false
            )
          }
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-zinc-800 bg-zinc-950 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  Payment Method
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Choose how you want to pay
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPaymentSheetOpen(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900"
              >
                <X
                  size={17}
                />
              </button>
            </div>

            <div className="mt-5 space-y-2">

              {/* ONLINE */}

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    "ONLINE"
                  )
                }
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left ${
                  paymentMethod ===
                  "ONLINE"
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <CreditCard
                    size={19}
                    className="text-orange-500"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Online Payment
                  </p>

                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Razorpay • UPI, cards and enabled methods
                  </p>
                </div>

                {paymentMethod ===
                  "ONLINE" && (
                  <Check
                    size={18}
                    className="text-orange-500"
                  />
                )}
              </button>

              {/* WALLET */}

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    "WALLET"
                  )
                }
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left ${
                  paymentMethod ===
                  "WALLET"
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <Wallet
                    size={19}
                    className="text-orange-500"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    CampusVita Wallet
                  </p>

                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Balance: ₹
                    {profile?.wallet?.toFixed(
                      0
                    ) ?? "0"}
                  </p>
                </div>

                {paymentMethod ===
                  "WALLET" && (
                  <Check
                    size={18}
                    className="text-orange-500"
                  />
                )}
              </button>

              {/* COD */}

              <button
                type="button"
                onClick={() =>
                  setPaymentMethod(
                    "COD"
                  )
                }
                className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left ${
                  paymentMethod ===
                  "COD"
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-zinc-800 bg-zinc-900"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <ShoppingBag
                    size={19}
                    className="text-orange-500"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Cash on Delivery
                  </p>

                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    Pay when your order is collected
                  </p>
                </div>

                {paymentMethod ===
                  "COD" && (
                  <Check
                    size={18}
                    className="text-orange-500"
                  />
                )}
              </button>

            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-black px-3 py-3">
              <div>
                <p className="text-[10px] text-zinc-500">
                  Selected
                </p>

                <p className="text-sm font-semibold">
                  {paymentLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPaymentSheetOpen(
                    false
                  )
                }
                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}