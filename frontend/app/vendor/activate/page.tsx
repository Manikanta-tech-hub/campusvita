"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Store,
} from "lucide-react";

import { VENDOR_ACTIVATED_FLAG } from "@/app/lib/auth/session";
import LoginHero from "@/components/auth/LoginHero";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const GENERIC_VERIFY_ERROR =
  "Invalid or expired activation credentials.";

type InvitationPreview = {
  valid: boolean;
  vendor_id: string;
  business_name: string;
  owner_name: string;
  email: string;
};

function extractError(data: unknown, fallback: string): string {
  const detail = (data as { detail?: unknown } | null)?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  // FastAPI 422 responses carry an array of field errors.
  if (Array.isArray(detail)) {
    const message = detail.find(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof (item as { msg?: unknown }).msg === "string"
    );

    if (message) {
      return (message as { msg: string }).msg;
    }
  }

  return fallback;
}

export default function VendorActivatePage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  const [vendorId, setVendorId] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [invitation, setInvitation] =
    useState<InvitationPreview | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");

  // ============================================================
  // STEP 1 - verify Vendor ID + activation code
  // ============================================================

  async function handleVerify(event: FormEvent) {
    event.preventDefault();

    const trimmedVendorId = vendorId.trim();
    const trimmedCode = activationCode.trim();

    if (!trimmedVendorId || !trimmedCode) {
      setVerifyError(
        "Please enter both the Vendor ID and the activation code."
      );
      return;
    }

    try {
      setVerifying(true);
      setVerifyError("");

      const response = await fetch(
        `${API_URL}/vendor/activate/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor_id: trimmedVendorId,
            activation_code: trimmedCode,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setVerifyError(
          extractError(data, GENERIC_VERIFY_ERROR)
        );
        return;
      }

      setInvitation(data as InvitationPreview);
      setPassword("");
      setConfirmPassword("");
      setActivateError("");
      setStep(2);
    } catch {
      setVerifyError(
        "Something went wrong. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  // ============================================================
  // STEP 2 - choose a password and activate
  // ============================================================

  async function handleActivate(event: FormEvent) {
    event.preventDefault();

    if (!invitation) return;

    if (password !== confirmPassword) {
      setActivateError("Passwords do not match.");
      return;
    }

    try {
      setActivating(true);
      setActivateError("");

      const response = await fetch(
        `${API_URL}/vendor/activate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vendor_id: invitation.vendor_id,
            activation_code: activationCode.trim(),
            password,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setActivateError(
          extractError(
            data,
            "Activation failed. Please try again."
          )
        );
        return;
      }

      // Clear credentials from component state after success.
      setPassword("");
      setConfirmPassword("");
      setActivationCode("");
      setVendorId("");
      setInvitation(null);
      setStep(1);

      try {
        window.sessionStorage.setItem(
          VENDOR_ACTIVATED_FLAG,
          "1"
        );
      } catch {
        // Storage unavailable - redirect still happens.
      }

      router.replace("/login");
    } catch {
      setActivateError(
        "Something went wrong. Please try again."
      );
    } finally {
      setActivating(false);
    }
  }

  function handleBackToStepOne() {
    setPassword("");
    setConfirmPassword("");
    setActivateError("");
    setStep(1);
  }

  const inputClassName =
    "h-12 w-full rounded-xl border border-input-border bg-input px-4 text-sm text-text-primary outline-none transition placeholder:text-text-secondary/60 focus:border-brand focus:ring-4 focus:ring-brand/15";

  const labelClassName =
    "mb-2 block text-sm font-semibold text-text-primary";

  const primaryButtonClassName =
    "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-hover text-sm font-semibold text-white shadow-[0_10px_25px_rgba(104,110,232,0.20)] transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-x-clip bg-background md:grid md:min-h-[100dvh] md:grid-cols-2 md:grid-rows-1 lg:grid-cols-[1.12fr_1fr]">
      {/* Reuse the existing Login page hero without modifying it. */}
      <LoginHero />

      {/* Activation form panel */}
      <section className="relative z-10 -mt-6 flex min-h-0 w-full flex-1 flex-col overflow-y-auto rounded-t-[2rem] bg-background px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-8 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] sm:px-8 md:mt-0 md:rounded-none md:px-10 md:py-12 md:shadow-none lg:px-16">
        <div className="mx-auto my-auto w-[min(100%,27rem)] py-3">
          {/* Heading */}
          <div className="mb-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 ring-1 ring-brand/15">
              {step === 1 ? (
                <KeyRound className="h-5 w-5 text-brand" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-brand" />
              )}
            </div>

            <p className="text-sm font-semibold tracking-[0.04em] text-brand">
              CampusVita Vendor Portal
            </p>

            <h1 className="mt-2.5 text-[28px] font-bold leading-tight tracking-tight text-text-primary sm:text-[34px]">
              {step === 1 ? (
                <>
                  Activate your{" "}
                  <span className="text-brand">
                    account.
                  </span>
                </>
              ) : (
                <>
                  Set up your{" "}
                  <span className="text-brand">
                    account.
                  </span>
                </>
              )}
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-[15px]">
              {step === 1
                ? "Enter the Vendor ID and activation code provided by your CampusVita administrator to get started."
                : "Your invitation is verified. Confirm your details and create a secure password to finish setting up your vendor account."}
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-7">
            <div
              className="flex items-center gap-2"
              aria-label={`Step ${step} of 2`}
            >
              <span
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step >= 1 ? "bg-brand" : "bg-input-border"
                }`}
              />
              <span
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step >= 2 ? "bg-brand" : "bg-input-border"
                }`}
              />
              <span className="ml-2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Step {step} of 2
              </span>
            </div>
          </div>

          {/* STEP 1: Verify invitation */}
          {step === 1 ? (
            <form
              onSubmit={handleVerify}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="vendor-id"
                  className={labelClassName}
                >
                  Vendor ID
                </label>

                <input
                  id="vendor-id"
                  type="text"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  placeholder="e.g. VEN-7KQ9M2"
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="characters"
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="activation-code"
                  className={labelClassName}
                >
                  Activation Code
                </label>

                <input
                  id="activation-code"
                  type="text"
                  value={activationCode}
                  onChange={(e) =>
                    setActivationCode(e.target.value)
                  }
                  placeholder="Enter your 6-character code"
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="characters"
                  className={`${inputClassName} uppercase tracking-[0.22em]`}
                />

                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Use the activation code supplied by your administrator.
                </p>
              </div>

              {verifyError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-600"
                >
                  {verifyError}
                </p>
              )}

              <button
                type="submit"
                disabled={verifying}
                className={primaryButtonClassName}
              >
                {verifying ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Verifying invitation...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </>
                )}
              </button>

              <div className="flex items-start gap-3 rounded-xl border border-input-border bg-surface p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />

                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Secure vendor activation
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    Your invitation credentials are used to verify your vendor account before you create a password.
                  </p>
                </div>
              </div>
            </form>
          ) : (
            /* STEP 2: Create vendor password */
            <form
              onSubmit={handleActivate}
              className="space-y-5"
            >
              {/* Verified invitation details */}
              <div className="overflow-hidden rounded-2xl border border-input-border bg-surface">
                <div className="flex items-center gap-3 border-b border-input-border px-4 py-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10">
                    <Store className="h-5 w-5 text-brand" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text-primary">
                      Invitation verified
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      Confirm your account details
                    </p>
                  </div>

                  <ShieldCheck className="ml-auto h-5 w-5 shrink-0 text-emerald-500" />
                </div>

                <div className="space-y-3.5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="shrink-0 text-xs font-medium text-text-secondary">
                      Business
                    </span>
                    <span className="text-right text-sm font-semibold text-text-primary">
                      {invitation?.business_name}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="shrink-0 text-xs font-medium text-text-secondary">
                      Owner
                    </span>
                    <span className="text-right text-sm font-semibold text-text-primary">
                      {invitation?.owner_name}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="shrink-0 text-xs font-medium text-text-secondary">
                      Email
                    </span>
                    <span className="max-w-[70%] break-all text-right text-sm font-medium text-text-primary">
                      {invitation?.email}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4 border-t border-input-border pt-3.5">
                    <span className="shrink-0 text-xs font-medium text-text-secondary">
                      Vendor ID
                    </span>
                    <span className="text-right text-sm font-semibold text-brand">
                      {invitation?.vendor_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className={labelClassName}
                >
                  Create Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    className={`${inputClassName} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((v) => !v)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-text-secondary transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className={labelClassName}
                >
                  Confirm Password
                </label>

                <input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={inputClassName}
                />
              </div>

              <div className="rounded-xl bg-surface px-4 py-3">
                <p className="text-xs font-semibold text-text-primary">
                  Password requirements
                </p>

                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  At least 8 characters, including an uppercase letter, a lowercase letter, a number, and a special character.
                </p>
              </div>

              {activateError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-600"
                >
                  {activateError}
                </p>
              )}

              <button
                type="submit"
                disabled={activating}
                className={primaryButtonClassName}
              >
                {activating ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Activating account...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Activate Account
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToStepOne}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-input-border text-sm font-semibold text-text-secondary transition hover:border-brand/40 hover:text-brand"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to credentials
              </button>
            </form>
          )}

          {/* Login navigation */}
          <div className="mt-7 border-t border-input-border pt-5 text-center">
            <p className="text-sm text-text-secondary">
              Already activated your account?{" "}
              <Link
                href="/login"
                className="font-semibold text-brand transition hover:underline"
              >
                Back to Login
              </Link>
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-text-secondary/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Your vendor credentials are handled securely.</span>
          </div>
        </div>
      </section>
    </main>
  );
}