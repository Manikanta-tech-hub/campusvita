"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Mail,
  LockKeyhole,
} from "lucide-react";

import BrandLogo from "@/components/branding/BrandLogo";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function ForgotPasswordPage() {
  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // SEND PASSWORD RESET OTP
  // ============================================================

  const handleForgotPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    // Normalize email
    const userEmail = email.trim().toLowerCase();

    // ==========================================================
    // VALIDATE EMAIL
    // ==========================================================

    if (!userEmail) {
      toast.error("Please enter your email address");
      return;
    }

    // ==========================================================
    // SEND REQUEST
    // ==========================================================

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: userEmail,
          }),
        }
      );

      // ========================================================
      // PARSE RESPONSE
      // ========================================================

      let data: any;

      try {
        data = await response.json();
      } catch (error) {
        console.error(
          "Forgot password response JSON error:",
          error
        );

        toast.error(
          "Server returned an unexpected response"
        );

        return;
      }

      // ========================================================
      // SUCCESS
      // ========================================================

      if (response.ok) {
        toast.success(
          data?.message ||
            "Password reset OTP sent successfully!"
        );

        // Save email locally as backup
        localStorage.setItem(
          "reset_email",
          userEmail
        );

        // Clear input
        setEmail("");

        // Redirect to OTP verification page
        router.push(
          `/verify-reset-otp?email=${encodeURIComponent(
            userEmail
          )}`
        );

        return;
      }

      // ========================================================
      // FAILED
      // ========================================================

      toast.error(
        data?.message ||
          data?.detail ||
          "Unable to send password reset OTP"
      );

    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      toast.error(
        "Unable to connect to the server"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-[var(--background)]">

      {/* ======================================================
          DESKTOP VERSION
      ====================================================== */}

      <div className="relative hidden min-h-screen min-h-[100dvh] w-full overflow-hidden md:block">

        {/* BACKGROUND IMAGE */}

        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/images/login-background.jpeg')",
          }}
        />

        {/* DARK OVERLAY */}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />

        {/* CONTENT */}

        <div className="relative z-10 min-h-screen min-h-[100dvh] w-full">

          {/* LOGO */}

          <Link
            href="/"
            className="absolute left-[5%] top-[6%]"
          >
            <h1>
              <BrandLogo plate className="h-[clamp(26px,2.2vw,36px)]" />
            </h1>
          </Link>

          {/* LEFT CONTENT */}

          <div className="absolute left-[5%] top-1/2 -translate-y-1/2">

            <h2 className="text-[clamp(42px,4.5vw,76px)] font-bold leading-none tracking-tight text-white drop-shadow-xl">

              Reset Your{" "}

              <span className="text-brand">
                Password
              </span>

            </h2>

            <p className="mt-5 text-[clamp(16px,1.35vw,24px)] font-medium text-white/90 drop-shadow-lg">

              Don't worry, we'll help you get back in.

            </p>

          </div>

          {/* ==================================================
              FORGOT PASSWORD CARD
          ================================================== */}

          <section className="absolute right-[6%] top-1/2 w-[min(42vw,590px)] -translate-y-1/2 rounded-[36px] border-[var(--border)] bg-card/95 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:p-10 xl:p-12">

            {/* ICON */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[0_10px_30px_rgba(0,0,0,0.14)]">

              <LockKeyhole
                size={38}
                strokeWidth={1.8}
                className="text-brand-hover"
              />

            </div>

            {/* HEADING */}

            <div className="mt-7 text-center">

              <h2 className="text-[clamp(26px,2vw,36px)] font-bold tracking-tight text-zinc-900">

                Forgot{" "}

                <span className="text-brand-hover">
                  Password?
                </span>

              </h2>

              <p className="mt-3 text-sm leading-relaxed text-zinc-500 md:text-base">

                Enter your email address and we'll send you
                a verification code to reset your password.

              </p>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleForgotPassword}
              className="mt-8 space-y-5"
            >

              {/* EMAIL */}

              <div className="relative">

                <Mail
                  size={23}
                  strokeWidth={1.8}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={loading}
                  autoComplete="email"
                  aria-label="Email address"
                  required
                  className="h-16 w-full rounded-2xl border border-zinc-200 bg-input pl-14 pr-5 text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-brand focus:ring-4 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

              {/* SEND OTP BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-brand via-brand to-brand-hover text-lg font-semibold text-white shadow-[0_12px_30px_rgba(104,110,232,0.35)] transition-all hover:scale-[1.01] hover:shadow-[0_16px_35px_rgba(104,110,232,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  "Sending OTP..."
                ) : (
                  <>
                    <span>
                      Send OTP
                    </span>

                    <ArrowRight
                      size={25}
                      className="ml-3 transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* BACK TO LOGIN */}

            <div className="mt-7 text-center">

              <button
                type="button"
                onClick={() => router.push("/login")}
                disabled={loading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-active transition-colors hover:text-brand-active disabled:opacity-50"
              >

                <ArrowLeft size={19} />

                Back to Login

              </button>

            </div>

          </section>

        </div>

      </div>

      {/* ======================================================
          MOBILE VERSION
      ====================================================== */}

      <div className="relative flex min-h-screen min-h-[100dvh] w-full flex-col overflow-hidden bg-[var(--background)] md:hidden">

        {/* MOBILE IMAGE SECTION */}

        <section className="relative h-[46dvh] min-h-[390px] w-full shrink-0 overflow-hidden">

          {/* BACKGROUND */}

          <div
            className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('/images/login-background.jpeg')",
            }}
          />

          {/* OVERLAY */}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/80" />

          {/* CONTENT */}

          <div className="relative z-10 h-full w-full px-6 pt-[max(2rem,env(safe-area-inset-top))]">

            {/* LOGO */}

            <Link href="/">
              <h1>
                <BrandLogo plate className="h-[26px]" />
              </h1>
            </Link>

            {/* TEXT */}

            <div className="absolute bottom-16 left-6 right-6">

              <h2 className="text-[clamp(36px,10vw,48px)] font-bold leading-tight tracking-tight text-white drop-shadow-xl">

                Reset Your{" "}

                <span className="text-brand">
                  Password
                </span>

              </h2>

              <p className="mt-2 text-base font-medium text-white/90 drop-shadow-lg">

                We'll help you get back into your account.

              </p>

            </div>

          </div>

        </section>

        {/* ==================================================
            MOBILE BOTTOM SHEET
        ================================================== */}

        <section className="relative z-20 -mt-8 flex min-h-[54dvh] w-full flex-1 flex-col rounded-t-[34px] bg-card px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_50px_rgba(0,0,0,0.35)]">

          {/* HANDLE */}

          <div className="mx-auto h-1.5 w-14 shrink-0 rounded-full bg-zinc-300" />

          {/* ICON */}

          <div className="mx-auto mt-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-card shadow-[0_8px_22px_rgba(0,0,0,0.12)]">

            <LockKeyhole
              size={31}
              strokeWidth={1.8}
              className="text-brand-hover"
            />

          </div>

          {/* HEADING */}

          <div className="mt-4 text-center">

            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">

              Forgot{" "}

              <span className="text-brand-hover">
                Password?
              </span>

            </h2>

            <p className="mt-2 text-xs leading-relaxed text-zinc-500">

              Enter your email and we'll send you a
              verification code to reset your password.

            </p>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleForgotPassword}
            className="mt-6 w-full space-y-4"
          >

            {/* EMAIL */}

            <div className="relative w-full">

              <Mail
                size={21}
                strokeWidth={1.8}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                autoComplete="email"
                aria-label="Email address"
                required
                className="h-14 w-full rounded-xl border border-zinc-200 bg-input pl-12 pr-4 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-brand focus:ring-2 focus:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50"
              />

            </div>

            {/* SEND OTP BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="group flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand via-brand to-brand-hover font-semibold text-white shadow-[0_10px_25px_rgba(104,110,232,0.32)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                "Sending OTP..."
              ) : (
                <>
                  <span>
                    Send OTP
                  </span>

                  <ArrowRight
                    size={21}
                    className="ml-3"
                  />

                </>
              )}

            </button>

          </form>

          {/* BACK TO LOGIN */}

          <div className="mt-6 text-center">

            <button
              type="button"
              onClick={() => router.push("/login")}
              disabled={loading}
              className="inline-flex items-center gap-2 text-xs font-semibold text-brand-active disabled:opacity-50"
            >

              <ArrowLeft size={17} />

              Back to Login

            </button>

          </div>

        </section>

      </div>

    </main>
  );
}