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

        <div className="relative z-10 flex min-h-screen min-h-[100dvh] w-full items-center justify-center gap-10 px-[5%] py-24 lg:justify-between">

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

          <div className="hidden min-w-0 flex-1 lg:block">

            <h2 className="text-[clamp(42px,4.5vw,76px)] font-bold leading-none tracking-[-0.03em] text-white! drop-shadow-xl">

              Reset Your{" "}

              <span className="text-[var(--accent)]">
                Password
              </span>

            </h2>

            <p className="mt-5 text-[clamp(16px,1.35vw,24px)] font-medium text-white/90! drop-shadow-lg">

              Don't worry, we'll help you get back in.

            </p>

          </div>

          {/* ==================================================
              FORGOT PASSWORD CARD
          ================================================== */}

          <section className="cv-glass-elevated w-[min(90vw,520px)] max-h-[calc(100dvh-6rem)] shrink-0 overflow-y-auto rounded-3xl p-8 lg:w-[min(46vw,560px)] lg:p-10 xl:p-12">

            {/* ICON */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface)] shadow-[var(--shadow-card)]">

              <LockKeyhole
                size={38}
                strokeWidth={1.8}
                className="text-[var(--accent-text)]"
              />

            </div>

            {/* HEADING */}

            <div className="mt-7 text-center">

              <h2 className="text-[clamp(26px,2vw,36px)] font-bold tracking-[-0.02em] text-[var(--text-primary)]">

                Forgot{" "}

                <span className="text-[var(--accent-text)]">
                  Password?
                </span>

              </h2>

              <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)] md:text-base">

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
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
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
                  className="h-16 w-full rounded-2xl border border-[var(--input-border)] bg-[var(--input)] pl-14 pr-5 text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

              {/* SEND OTP BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="cv-press group flex h-16 w-full items-center justify-center rounded-2xl bg-[var(--accent)] text-lg! font-semibold! text-[var(--on-accent)] shadow-[var(--accent-shadow)] transition-all hover:scale-[1.01] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
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
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
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

              <h2 className="text-[clamp(36px,10vw,48px)] font-bold leading-tight tracking-[-0.03em] text-white! drop-shadow-xl">

                Reset Your{" "}

                <span className="text-[var(--accent)]">
                  Password
                </span>

              </h2>

              <p className="mt-2 text-base font-medium text-white/90! drop-shadow-lg">

                We'll help you get back into your account.

              </p>

            </div>

          </div>

        </section>

        {/* ==================================================
            MOBILE BOTTOM SHEET
        ================================================== */}

        <section className="cv-glass-elevated relative z-20 -mt-8 flex min-h-[54dvh] w-full flex-1 flex-col overflow-y-auto rounded-3xl px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3">

          {/* HANDLE */}

          <div className="mx-auto h-1.5 w-14 shrink-0 rounded-full bg-[var(--border-strong)]" />

          {/* ICON */}

          <div className="mx-auto mt-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] shadow-[var(--shadow-card)]">

            <LockKeyhole
              size={31}
              strokeWidth={1.8}
              className="text-[var(--accent-text)]"
            />

          </div>

          {/* HEADING */}

          <div className="mt-4 text-center">

            <h2 className="text-2xl font-bold tracking-[-0.02em] text-[var(--text-primary)]">

              Forgot{" "}

              <span className="text-[var(--accent-text)]">
                Password?
              </span>

            </h2>

            <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">

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
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
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
                className="h-14 w-full rounded-xl border border-[var(--input-border)] bg-[var(--input)] pl-12 pr-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft-strong)] disabled:cursor-not-allowed disabled:opacity-50"
              />

            </div>

            {/* SEND OTP BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="cv-press group flex h-14 w-full items-center justify-center rounded-xl bg-[var(--accent)] font-semibold! text-[var(--on-accent)] shadow-[var(--accent-shadow)] transition-all hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
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
              className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
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