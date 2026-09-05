"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function VerifyResetOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ============================================================
  // STATE
  // ============================================================

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // ============================================================
  // REDIRECT IF EMAIL IS MISSING
  // ============================================================

  useEffect(() => {
    if (!email) {
      toast.error("Email address is missing");

      router.replace("/forgot-password");
    }
  }, [email, router]);

  // ============================================================
  // GET FULL OTP
  // ============================================================

  const otpValue = otp.join("");

  // ============================================================
  // HANDLE OTP INPUT
  // ============================================================

  const handleOtpChange = (
    value: string,
    index: number
  ) => {
    // Allow only numbers
    const cleanedValue = value.replace(/\D/g, "");

    if (!cleanedValue) {
      const newOtp = [...otp];

      newOtp[index] = "";

      setOtp(newOtp);

      return;
    }

    // Handle pasted OTP
    if (cleanedValue.length > 1) {
      const numbers = cleanedValue
        .slice(0, 6)
        .split("");

      const newOtp = ["", "", "", "", "", ""];

      numbers.forEach((number, i) => {
        newOtp[i] = number;
      });

      setOtp(newOtp);

      const nextIndex = Math.min(
        numbers.length,
        5
      );

      inputRefs.current[nextIndex]?.focus();

      return;
    }

    const newOtp = [...otp];

    newOtp[index] = cleanedValue;

    setOtp(newOtp);

    // Move automatically to next input
    if (
      cleanedValue &&
      index < otp.length - 1
    ) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ============================================================
  // HANDLE BACKSPACE
  // ============================================================

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ============================================================
  // VERIFY OTP
  // ============================================================

  const handleVerifyOTP = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email address is missing");

      router.push("/forgot-password");

      return;
    }

    if (otpValue.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");

      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/verify-reset-otp`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otpValue,
          }),
        }
      );

      let data: any;

      try {
        data = await response.json();
      } catch (error) {
        console.error(
          "OTP verification response JSON error:",
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
            "OTP verified successfully!"
        );

        // ========================================================
        // REDIRECT TO RESET PASSWORD PAGE
        // ========================================================

        router.push(
          `/reset-password?email=${encodeURIComponent(
            email
          )}`
        );

        return;
      }

      // ==========================================================
      // FAILED
      // ==========================================================

      toast.error(
        data?.message ||
          data?.detail ||
          "Invalid OTP"
      );

    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      toast.error(
        "Backend Server Not Running"
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RESEND OTP
  // ============================================================

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email address is missing");

      router.push("/forgot-password");

      return;
    }

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
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          data?.message ||
            "A new OTP has been sent!"
        );

        setOtp(["", "", "", "", "", ""]);

        inputRefs.current[0]?.focus();

        return;
      }

      toast.error(
        data?.message ||
          data?.detail ||
          "Unable to resend OTP"
      );

    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );

      toast.error(
        "Backend Server Not Running"
      );

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

          {/* ==================================================
              LOGO
          ================================================== */}

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

          {/* ==================================================
              LEFT CONTENT
          ================================================== */}

          <div className="absolute left-[5%] top-1/2 -translate-y-1/2">

            <h2 className="text-[clamp(42px,4.5vw,76px)] font-bold leading-none tracking-tight text-white drop-shadow-xl">

              Verify Your{" "}

              <span className="text-orange-500">
                OTP
              </span>

            </h2>

            <p className="mt-5 text-[clamp(16px,1.35vw,24px)] font-medium text-white/90 drop-shadow-lg">

              Enter the verification code sent to your email.

            </p>

          </div>

          {/* ==================================================
              OTP CARD
          ================================================== */}

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

                Verify{" "}

                <span className="text-orange-600">
                  OTP
                </span>

              </h2>

              <p className="mt-3 text-sm leading-relaxed text-zinc-500 md:text-base">

                We've sent a 6-digit verification code to

              </p>

              <p className="mt-1 break-all text-sm font-semibold text-orange-600 md:text-base">

                {email || "your email address"}

              </p>

            </div>

            {/* ==================================================
                FORM
            ================================================== */}

            <form
              onSubmit={handleVerifyOTP}
              className="mt-8"
            >

              {/* OTP INPUTS */}

              <div className="flex justify-center gap-2 sm:gap-3">

                {otp.map((digit, index) => (

                  <input
                    key={index}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    disabled={loading}
                    onChange={(e) =>
                      handleOtpChange(
                        e.target.value,
                        index
                      )
                    }
                    onKeyDown={(e) =>
                      handleKeyDown(e, index)
                    }
                    onPaste={(e) => {
                      const pastedText =
                        e.clipboardData.getData("text");

                      const numbers =
                        pastedText.replace(/\D/g, "");

                      if (numbers.length > 1) {
                        e.preventDefault();

                        handleOtpChange(
                          numbers,
                          index
                        );
                      }
                    }}
                    aria-label={`OTP digit ${index + 1}`}
                    className="h-14 w-11 rounded-xl border border-zinc-200 bg-white text-center text-xl font-bold text-zinc-900 outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-14"
                  />

                ))}

              </div>

              {/* VERIFY BUTTON */}

              <button
                type="submit"
                disabled={
                  loading ||
                  otpValue.length !== 6
                }
                className="group mt-8 flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 via-orange-600 to-red-600 text-lg font-semibold text-white shadow-[0_12px_30px_rgba(234,88,12,0.35)] transition-all hover:scale-[1.01] hover:shadow-[0_16px_35px_rgba(234,88,12,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  "Verifying OTP..."
                ) : (
                  <>
                    <span>
                      Verify OTP
                    </span>

                    <ArrowRight
                      size={25}
                      className="ml-3 transition-transform group-hover:translate-x-1"
                    />

                  </>
                )}

              </button>

            </form>

            {/* RESEND OTP */}

            <div className="mt-6 text-center">

              <p className="text-sm text-zinc-500">

                Didn't receive the code?

              </p>

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="mt-2 font-semibold text-orange-600 transition-colors hover:text-orange-800 disabled:opacity-50"
              >

                Resend OTP

              </button>

            </div>

            {/* BACK */}

            <div className="mt-6 text-center">

              <button
                type="button"
                onClick={() =>
                  router.push("/forgot-password")
                }
                className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 transition-colors hover:text-orange-900"
              >

                <ArrowLeft size={19} />

                Back

              </button>

            </div>

          </section>

        </div>

      </div>

      {/* ======================================================
          MOBILE VERSION
      ====================================================== */}

      <div className="relative flex min-h-screen min-h-[100dvh] w-full flex-col overflow-hidden bg-[#1a0d07] md:hidden">

        {/* ==================================================
            MOBILE IMAGE SECTION
        ================================================== */}

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

                Verify Your{" "}

                <span className="text-orange-500">
                  OTP
                </span>

              </h2>

              <p className="mt-2 text-base font-medium text-white/90 drop-shadow-lg">

                Enter the code sent to your email.

              </p>

            </div>

          </div>

        </section>

        {/* ==================================================
            MOBILE BOTTOM SHEET
        ================================================== */}

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

              Verify{" "}

              <span className="text-orange-600">
                OTP
              </span>

            </h2>

            <p className="mt-2 text-xs leading-relaxed text-zinc-500">

              Enter the 6-digit code sent to

            </p>

            <p className="mt-1 break-all text-xs font-semibold text-orange-600">

              {email || "your email address"}

            </p>

          </div>

          {/* FORM */}

          <form
            onSubmit={handleVerifyOTP}
            className="mt-6 w-full"
          >

            {/* OTP BOXES */}

            <div className="flex justify-center gap-2">

              {otp.map((digit, index) => (

                <input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  disabled={loading}
                  onChange={(e) =>
                    handleOtpChange(
                      e.target.value,
                      index
                    )
                  }
                  onKeyDown={(e) =>
                    handleKeyDown(e, index)
                  }
                  onPaste={(e) => {
                    const pastedText =
                      e.clipboardData.getData("text");

                    const numbers =
                      pastedText.replace(/\D/g, "");

                    if (numbers.length > 1) {
                      e.preventDefault();

                      handleOtpChange(
                        numbers,
                        index
                      );
                    }
                  }}
                  aria-label={`OTP digit ${index + 1}`}
                  className="h-12 w-10 rounded-lg border border-zinc-200 bg-white text-center text-lg font-bold text-zinc-900 outline-none transition-all focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                />

              ))}

            </div>

            {/* VERIFY BUTTON */}

            <button
              type="submit"
              disabled={
                loading ||
                otpValue.length !== 6
              }
              className="group mt-7 flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-600 via-orange-600 to-red-600 font-semibold text-white shadow-[0_10px_25px_rgba(234,88,12,0.32)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                "Verifying OTP..."
              ) : (
                <>
                  <span>
                    Verify OTP
                  </span>

                  <ArrowRight
                    size={21}
                    className="ml-3"
                  />

                </>
              )}

            </button>

          </form>

          {/* RESEND */}

          <div className="mt-5 text-center">

            <p className="text-xs text-zinc-500">

              Didn't receive the code?

            </p>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={loading}
              className="mt-2 text-sm font-semibold text-orange-600 disabled:opacity-50"
            >

              Resend OTP

            </button>

          </div>

          {/* BACK */}

          <div className="mt-5 text-center">

            <button
              type="button"
              onClick={() =>
                router.push("/forgot-password")
              }
              className="inline-flex items-center gap-2 text-xs font-semibold text-orange-700"
            >

              <ArrowLeft size={17} />

              Back

            </button>

          </div>

        </section>

      </div>

    </main>
  );
}