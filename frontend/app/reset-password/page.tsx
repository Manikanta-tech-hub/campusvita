"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import {
  Suspense,
  useState,
  type FormEvent,
  useEffect,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ============================================================
  // STATE
  // ============================================================

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  // ============================================================
  // GET EMAIL FROM URL
  // ============================================================

  useEffect(() => {
    const emailFromUrl = searchParams.get("email");

    if (!emailFromUrl) {
      toast.error(
        "Email address is missing. Please request a new OTP."
      );

      router.replace("/forgot-password");
      return;
    }

    setEmail(emailFromUrl.trim().toLowerCase());
  }, [searchParams, router]);

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  const handleResetPassword = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const userEmail = email.trim().toLowerCase();

    // ==========================================================
    // VALIDATE EMAIL
    // ==========================================================

    if (!userEmail) {
      toast.error("Email address is missing");
      router.push("/forgot-password");
      return;
    }

    // ==========================================================
    // VALIDATE PASSWORD
    // ==========================================================

    if (!newPassword.trim()) {
      toast.error("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // ==========================================================
    // CONFIRM PASSWORD
    // ==========================================================

    if (!confirmPassword.trim()) {
      toast.error("Please confirm your new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // ==========================================================
    // API REQUEST
    // ==========================================================

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
            new_password: newPassword,
          }),
        }
      );

      let data: any;

      try {
        data = await response.json();
      } catch (error) {
        console.error(
          "Reset password response JSON error:",
          error
        );

        toast.error(
          "Server returned an unexpected response"
        );

        return;
      }

      // ==========================================================
      // SUCCESS
      // ==========================================================

      if (response.ok) {
        toast.success(
          data?.message ||
            "Password reset successfully!"
        );

        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          router.replace("/login");
        }, 1200);

        return;
      }

      // ==========================================================
      // FAILED
      // ==========================================================

      toast.error(
        data?.message ||
          data?.detail ||
          "Unable to reset password"
      );
    } catch (error) {
      console.error(
        "Reset password error:",
        error
      );

      toast.error("Backend Server Not Running");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-[#1a0d07]">

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
            <h1 className="text-[clamp(24px,2vw,34px)] font-bold tracking-tight text-white drop-shadow-lg">
              Campus
              <span className="text-orange-500">
                Vita
              </span>
            </h1>
          </Link>

          {/* LEFT CONTENT */}

          <div className="absolute left-[5%] top-1/2 -translate-y-1/2">

            <h2 className="text-[clamp(42px,4.5vw,76px)] font-bold leading-none tracking-tight text-white drop-shadow-xl">
              Create New{" "}
              <span className="text-orange-500">
                Password
              </span>
            </h2>

            <p className="mt-5 text-[clamp(16px,1.35vw,24px)] font-medium text-white/90 drop-shadow-lg">
              Choose a strong password to secure your account.
            </p>

          </div>

          {/* RESET PASSWORD CARD */}

          <section className="absolute right-[6%] top-1/2 w-[min(42vw,590px)] -translate-y-1/2 rounded-[36px] border border-white/60 bg-white/95 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:p-10 xl:p-12">

            {/* ICON */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
              <ShieldCheck
                size={40}
                strokeWidth={1.8}
                className="text-orange-600"
              />
            </div>

            {/* HEADING */}

            <div className="mt-7 text-center">

              <h2 className="text-[clamp(26px,2vw,36px)] font-bold tracking-tight text-zinc-900">
                Reset Your{" "}
                <span className="text-orange-600">
                  Password
                </span>
              </h2>

              <p className="mt-3 text-sm leading-relaxed text-zinc-500 md:text-base">
                Create a new secure password for your
                CampusVita account.
              </p>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleResetPassword}
              className="mt-8 space-y-5"
            >

              {/* NEW PASSWORD */}

              <div className="relative">

                <LockKeyhole
                  size={23}
                  strokeWidth={1.8}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  aria-label="New password"
                  className="h-16 w-full rounded-2xl border border-zinc-200 bg-white pl-14 pr-14 text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showNewPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-orange-600 disabled:cursor-not-allowed"
                >
                  {showNewPassword ? (
                    <EyeOff
                      size={22}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Eye
                      size={22}
                      strokeWidth={1.8}
                    />
                  )}
                </button>

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="relative">

                <LockKeyhole
                  size={23}
                  strokeWidth={1.8}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  aria-label="Confirm new password"
                  className="h-16 w-full rounded-2xl border border-zinc-200 bg-white pl-14 pr-14 text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-orange-600 disabled:cursor-not-allowed"
                >
                  {showConfirmPassword ? (
                    <EyeOff
                      size={22}
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Eye
                      size={22}
                      strokeWidth={1.8}
                    />
                  )}
                </button>

              </div>

              {/* PASSWORD REQUIREMENT */}

              <p className="px-1 text-xs text-zinc-500">
                Password must contain at least 6 characters.
              </p>

              {/* RESET BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 via-orange-600 to-red-600 text-lg font-semibold text-white shadow-[0_12px_30px_rgba(234,88,12,0.35)] transition-all hover:scale-[1.01] hover:shadow-[0_16px_35px_rgba(234,88,12,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  "Resetting Password..."
                ) : (
                  <>
                    <span>
                      Reset Password
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
                onClick={() =>
                  router.push("/login")
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 transition-colors hover:text-orange-900"
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

      <div className="relative flex min-h-screen min-h-[100dvh] w-full flex-col overflow-hidden bg-[#1a0d07] md:hidden">

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
              <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">
                Campus
                <span className="text-orange-500">
                  Vita
                </span>
              </h1>
            </Link>

            {/* TEXT */}

            <div className="absolute bottom-16 left-6 right-6">

              <h2 className="text-[clamp(36px,10vw,48px)] font-bold leading-tight tracking-tight text-white drop-shadow-xl">
                Create New{" "}
                <span className="text-orange-500">
                  Password
                </span>
              </h2>

              <p className="mt-2 text-base font-medium text-white/90 drop-shadow-lg">
                Secure your account with a new password.
              </p>

            </div>

          </div>

        </section>

        {/* MOBILE BOTTOM SHEET */}

        <section className="relative z-20 -mt-8 flex min-h-[54dvh] w-full flex-1 flex-col rounded-t-[34px] bg-[#fafafa] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_50px_rgba(0,0,0,0.35)]">

          {/* HANDLE */}

          <div className="mx-auto h-1.5 w-14 shrink-0 rounded-full bg-zinc-300" />

          {/* ICON */}

          <div className="mx-auto mt-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_22px_rgba(0,0,0,0.12)]">

            <ShieldCheck
              size={32}
              strokeWidth={1.8}
              className="text-orange-600"
            />

          </div>

          {/* HEADING */}

          <div className="mt-4 text-center">

            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
              Reset Your{" "}
              <span className="text-orange-600">
                Password
              </span>
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Create a new secure password for your account.
            </p>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleResetPassword}
            className="mt-6 w-full space-y-4"
          >

            {/* NEW PASSWORD */}

            <div className="relative w-full">

              <LockKeyhole
                size={21}
                strokeWidth={1.8}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                placeholder="New Password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                disabled={loading}
                autoComplete="new-password"
                aria-label="New password"
                className="h-14 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-12 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(
                    !showNewPassword
                  )
                }
                disabled={loading}
                aria-label={
                  showNewPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                {showNewPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="relative w-full">

              <LockKeyhole
                size={21}
                strokeWidth={1.8}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                disabled={loading}
                autoComplete="new-password"
                aria-label="Confirm new password"
                className="h-14 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-12 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                disabled={loading}
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

            {/* PASSWORD INFO */}

            <p className="px-1 text-xs text-zinc-500">
              Password must contain at least 6 characters.
            </p>

            {/* BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="group flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-600 via-orange-600 to-red-600 font-semibold text-white shadow-[0_10px_25px_rgba(234,88,12,0.32)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Resetting Password..."
              ) : (
                <>
                  <span>
                    Reset Password
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
              onClick={() =>
                router.push("/login")
              }
              className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700"
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

// ============================================================
// PAGE WRAPPER
// Fixes Next.js useSearchParams prerendering requirement
// ============================================================

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-[#1a0d07]">
          <div className="text-lg font-semibold text-white">
            Loading...
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}