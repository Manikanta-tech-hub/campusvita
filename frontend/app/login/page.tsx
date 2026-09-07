"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRoundPlus,
} from "lucide-react";

import { saveSession } from "@/app/lib/auth/session";

import {
  getFCMToken,
  auth,
  googleProvider,
} from "@/app/firebase";

import {
  signInWithPopup,
} from "firebase/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();

  // ============================================================
  // STATE
  // ============================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  // ============================================================
  // NORMAL EMAIL LOGIN
  // ============================================================

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please Fill All Fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      let data: any;

      try {
        data = await response.json();
      } catch (error) {
        console.error(
          "Login response JSON error:",
          error
        );

        toast.error(
          "Server returned an unexpected response"
        );

        return;
      }

      // ========================================================
      // LOGIN SUCCESS
      // ========================================================

      // ========================================================
// GOOGLE LOGIN SUCCESS
// ========================================================

if (response.ok) {

  console.log(
    "🔥 GOOGLE BACKEND RESPONSE:",
    data
  );

  const role = data?.user?.role;

  console.log(
    "🔥 GOOGLE USER ROLE:",
    role
  );

  // ======================================================
  // VALIDATE ROLE
  // ======================================================

  if (
    role !== "ADMIN" &&
    role !== "USER" &&
    role !== "VENDOR"
  ) {
    console.error(
      "❌ Invalid role returned by backend:",
      role
    );

    toast.error(
      "Invalid user role returned by server"
    );

    return;
  }

  // ======================================================
  // VALIDATE ACCESS TOKEN
  // ======================================================

  if (!data.access_token) {
    console.error(
      "❌ Google login response does not contain access_token"
    );

    toast.error(
      "Google login failed: access token missing"
    );

    return;
  }

  // ======================================================
  // SAVE SESSION
  // ======================================================

  saveSession({
    accessToken: data.access_token,

    refreshToken:
      data.refresh_token || "",

    tokenType:
      data.token_type || "bearer",

    expiresIn:
      Number(data.expires_in || 0),

    user: {
      name:
        data.user.name || "",

      email:
        data.user.email || "",

      role,

      phone:
        data.user.phone || "",

      department:
        data.user.department || "",

      year:
        data.user.year || "",

      profile_image:
        data.user.profile_image || "",
    },
  });

  // ======================================================
  // DEBUG SAVED SESSION
  // ======================================================

  console.log(
    "🔥 SAVED USER SESSION:",
    localStorage.getItem(
      "campusvita_user_session"
    )
  );

  console.log(
    "🔥 SAVED ADMIN SESSION:",
    localStorage.getItem(
      "campusvita_admin_session"
    )
  );

  // ======================================================
  // SAVE FCM TOKEN
  // ======================================================

  try {
    const fcmToken =
      await getFCMToken();

    if (fcmToken) {
      await fetch(
        `${API_URL}/save-fcm-token`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: data.user.email,
            fcm_token: fcmToken,
          }),
        }
      );

      console.log(
        "✅ FCM token sent to backend"
      );
    }
  } catch (error) {
    console.error(
      "FCM setup error:",
      error
    );
  }

  // ======================================================
  // SUCCESS
  // ======================================================

  toast.success(
    data.message ||
      "Google Login Successful 🚀"
  );

  console.log(
    "🚀 REDIRECTING WITH ROLE:",
    role
  );

  // ======================================================
  // REDIRECT
  // ======================================================

  if (role === "ADMIN") {
    router.replace("/admin/dashboard");
  } else if (role === "VENDOR") {
    router.replace("/vendor/dashboard");
  } else {
    router.replace("/");
  }

  return;
}
      // ========================================================
      // LOGIN FAILED
      // ========================================================

      toast.error(
        data?.message ||
          data?.detail ||
          "Login failed. Please try again."
      );

    } catch (error) {
      console.error(
        "Login error:",
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
  // GOOGLE LOGIN
  // ============================================================

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // ========================================================
      // OPEN GOOGLE LOGIN POPUP
      // ========================================================

      const result =
        await signInWithPopup(
          auth,
          googleProvider
        );

      // ========================================================
      // GET FIREBASE ID TOKEN
      // ========================================================

      const idToken =
        await result.user.getIdToken();

      // ========================================================
      // SEND FIREBASE TOKEN TO BACKEND
      // ========================================================

      const response = await fetch(
        `${API_URL}/auth/google`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id_token: idToken,
          }),
        }
      );

      let data: any;

      try {
        data = await response.json();

      } catch (error) {
        console.error(
          "Google login response JSON error:",
          error
        );

        toast.error(
          "Server returned an unexpected response"
        );

        return;
      }

      // ========================================================
      // GOOGLE LOGIN SUCCESS
      // ========================================================

      if (response.ok) {
        const role =
          data?.user?.role;

        // ======================================================
        // VALIDATE ROLE
        // ======================================================

        if (
          role !== "ADMIN" &&
          role !== "USER" &&
          role !== "VENDOR"
        ) {
          console.error(
            "Invalid role returned by backend:",
            role
          );

          toast.error(
            "Invalid user role returned by server"
          );

          return;
        }

        // ======================================================
        // VALIDATE ACCESS TOKEN
        // ======================================================

        if (!data.access_token) {
          console.error(
            "Google login response does not contain access_token"
          );

          toast.error(
            "Google login failed: access token missing"
          );

          return;
        }

        // ======================================================
        // SAVE SESSION
        // ======================================================

        saveSession({
          accessToken:
            data.access_token,

          refreshToken:
            data.refresh_token || "",

          tokenType:
            data.token_type || "bearer",

          expiresIn:
            Number(
              data.expires_in || 0
            ),

          user: {
            name:
              data.user.name || "",

            email:
              data.user.email || "",

            role,

            phone:
              data.user.phone || "",

            department:
              data.user.department || "",

            year:
              data.user.year || "",

            profile_image:
              data.user.profile_image || "",
          },
        });

        // ======================================================
        // SAVE FCM TOKEN
        // ======================================================

        try {
          const fcmToken =
            await getFCMToken();

          if (fcmToken) {
            await fetch(
              `${API_URL}/save-fcm-token`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  email:
                    data.user.email,

                  fcm_token:
                    fcmToken,
                }),
              }
            );

            console.log(
              "FCM token sent to backend"
            );
          }

        } catch (error) {
          console.error(
            "FCM setup error:",
            error
          );
        }

        // ======================================================
        // SUCCESS
        // ======================================================

        toast.success(
          data.message ||
            "Google Login Successful 🚀"
        );

        if (role === "ADMIN") {
          router.replace("/admin/dashboard");
        } else if (role === "VENDOR") {
          router.replace("/vendor/dashboard");
        } else {
          router.replace("/");
        }

        return;
      }

      // ========================================================
      // GOOGLE LOGIN FAILED
      // ========================================================

      toast.error(
        data?.message ||
          data?.detail ||
          "Google login failed. Please try again."
      );

    } catch (error: any) {
      console.error(
        "Google login error:",
        error
      );

      // ========================================================
      // USER CLOSED POPUP
      // ========================================================

      if (
        error?.code ===
        "auth/popup-closed-by-user"
      ) {
        toast.error(
          "Google login was cancelled"
        );

        return;
      }

      // ========================================================
      // POPUP BLOCKED
      // ========================================================

      if (
        error?.code ===
        "auth/popup-blocked"
      ) {
        toast.error(
          "Google popup was blocked by your browser"
        );

        return;
      }

      toast.error(
        "Google login failed. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative isolate min-h-screen min-h-[100dvh] w-full max-w-none overflow-x-clip bg-[#1a0d07]">

      {/* ======================================================
          DESKTOP VERSION
      ====================================================== */}

      <div className="relative hidden min-h-screen min-h-[100dvh] w-full overflow-hidden md:block">

        {/* BACKGROUND */}

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

          <div className="absolute left-[5%] top-[6%]">

            <h1 className="text-[clamp(24px,2vw,34px)] font-bold tracking-tight text-white drop-shadow-lg">

              Campus
              <span className="text-orange-500">
                Vita
              </span>

            </h1>

          </div>

          {/* WELCOME */}

          <div className="absolute left-[5%] top-1/2 -translate-y-1/2">

            <h2 className="text-[clamp(42px,4.5vw,76px)] font-bold leading-none tracking-tight text-white drop-shadow-xl">

              Welcome{" "}

              <span className="text-orange-500">
                Back!
              </span>

            </h2>

            <p className="mt-5 text-[clamp(16px,1.35vw,24px)] font-medium text-white/90 drop-shadow-lg">

              From Classrooms to Cravings.

            </p>

          </div>

          {/* DESKTOP LOGIN CARD */}

          <section className="absolute right-[6%] top-1/2 w-[min(42vw,590px)] -translate-y-1/2 rounded-[36px] border border-white/60 bg-white/95 p-8 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:p-10 xl:p-12">

            {/* USER ICON */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(0,0,0,0.14)]">

              <UserRoundPlus
                size={38}
                strokeWidth={1.8}
                className="text-orange-600"
              />

            </div>

            {/* HEADING */}

            <div className="mt-7 text-center">

              <h2 className="text-[clamp(26px,2vw,36px)] font-bold tracking-tight text-zinc-900">

                Log in to{" "}

                <span className="text-orange-600">
                  CampusVita
                </span>

              </h2>

              <p className="mt-2 text-sm text-zinc-500 md:text-base">

                Welcome back! Please enter your details.

              </p>

            </div>

            {/* LOGIN FORM */}

            <form
              onSubmit={handleLogin}
              className="mt-8 space-y-4"
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
                  aria-label="Email"
                  className="h-16 w-full rounded-2xl border border-zinc-200 bg-white pl-14 pr-5 text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                />

              </div>

              {/* PASSWORD */}

              <div className="relative">

                <LockKeyhole
                  size={23}
                  strokeWidth={1.8}
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  disabled={loading}
                  autoComplete="current-password"
                  aria-label="Password"
                  className="h-16 w-full rounded-2xl border border-zinc-200 bg-white pl-14 pr-14 text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-5 top-1/2 flex -translate-y-1/2 items-center justify-center text-zinc-500 transition-colors hover:text-orange-600"
                >

                  {showPassword ? (
                    <EyeOff
                      size={23}
                      strokeWidth={2}
                    />
                  ) : (
                    <Eye
                      size={23}
                      strokeWidth={2}
                    />
                  )}

                </button>

              </div>

              {/* REMEMBER / FORGOT */}

              <div className="flex items-center justify-between pt-1">

                <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-600">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                    disabled={loading}
                    className="h-5 w-5 cursor-pointer rounded border-zinc-300 accent-orange-600"
                  />

                  <span>
                    Remember me
                  </span>

                </label>

                <Link
  href="/forgot-password"
  className="text-sm font-medium text-orange-700 transition-colors hover:text-orange-900"
>
  Forgot Password?
</Link>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group mt-2 flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 via-orange-600 to-red-600 text-lg font-semibold text-white shadow-[0_12px_30px_rgba(234,88,12,0.35)] transition-all hover:scale-[1.01] hover:shadow-[0_16px_35px_rgba(234,88,12,0.45)] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  "Logging In..."
                ) : (
                  <>
                    <span>
                      Log In
                    </span>

                    <ArrowRight
                      size={25}
                      className="ml-3 transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}

              </button>

            </form>

            {/* DIVIDER */}

            <div className="my-7 flex items-center gap-4">

              <div className="h-px flex-1 bg-zinc-200" />

              <span className="whitespace-nowrap text-sm text-zinc-500">
                or continue with
              </span>

              <div className="h-px flex-1 bg-zinc-200" />

            </div>

            {/* GOOGLE LOGIN */}

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="flex h-16 w-full items-center justify-center gap-4 rounded-2xl border border-zinc-200 bg-white font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 disabled:opacity-50"
            >

              <GoogleIcon />

              <span>
                Continue with Google
              </span>

            </button>

            {/* SIGNUP */}

            <p className="mt-7 text-center text-sm text-zinc-600">

              Don't have an account?{" "}

              <Link
                href="/signup"
                className="font-semibold text-orange-700 transition-colors hover:text-orange-900"
              >
                Sign up
              </Link>

            </p>

          </section>

        </div>

      </div>

      {/* ======================================================
          MOBILE VERSION
      ====================================================== */}

      <div className="relative flex min-h-screen min-h-[100dvh] w-full flex-col overflow-hidden bg-[#1a0d07] md:hidden">

        {/* MOBILE IMAGE */}

        <section className="relative h-[46dvh] min-h-[390px] w-full shrink-0 overflow-hidden">

          <div
            className="absolute inset-0 h-full w-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('/images/login-background.jpeg')",
            }}
          />

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/80" />

          <div className="relative z-10 h-full w-full px-6 pt-[max(2rem,env(safe-area-inset-top))]">

            {/* LOGO */}

            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg">

              Campus
              <span className="text-orange-500">
                Vita
              </span>

            </h1>

            {/* WELCOME */}

            <div className="absolute bottom-16 left-6 right-6">

              <h2 className="text-[clamp(36px,10vw,48px)] font-bold leading-tight tracking-tight text-white drop-shadow-xl">

                Welcome{" "}

                <span className="text-orange-500">
                  Back!
                </span>

              </h2>

              <p className="mt-2 text-base font-medium text-white/90 drop-shadow-lg">

                From Classrooms to Cravings.

              </p>

            </div>

          </div>

        </section>

        {/* MOBILE LOGIN SHEET */}

        <section className="relative z-20 -mt-8 flex min-h-[62dvh] w-full flex-1 flex-col rounded-t-[34px] bg-[#fafafa] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_50px_rgba(0,0,0,0.35)]">

          {/* HANDLE */}

          <div className="mx-auto h-1.5 w-14 shrink-0 rounded-full bg-zinc-300" />

          {/* USER ICON */}

          <div className="mx-auto mt-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_8px_22px_rgba(0,0,0,0.12)]">

            <UserRoundPlus
              size={31}
              strokeWidth={1.8}
              className="text-orange-600"
            />

          </div>

          {/* HEADING */}

          <div className="mt-4 shrink-0 text-center">

            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">

              Log in to{" "}

              <span className="text-orange-600">
                CampusVita
              </span>

            </h2>

            <p className="mt-1 text-xs text-zinc-500">

              Welcome back! Please enter your details.

            </p>

          </div>

          {/* LOGIN FORM */}

          <form
            onSubmit={handleLogin}
            className="mt-6 w-full space-y-3"
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
                aria-label="Email"
                className="h-14 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

            </div>

            {/* PASSWORD */}

            <div className="relative w-full">

              <LockKeyhole
                size={21}
                strokeWidth={1.8}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
                autoComplete="current-password"
                aria-label="Password"
                className="h-14 w-full rounded-xl border border-zinc-200 bg-white pl-12 pr-12 text-sm text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (previous) => !previous
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-zinc-500 transition-colors active:scale-95"
              >

                {showPassword ? (
                  <EyeOff
                    size={21}
                    strokeWidth={2}
                  />
                ) : (
                  <Eye
                    size={21}
                    strokeWidth={2}
                  />
                )}

              </button>

            </div>

            {/* REMEMBER / FORGOT */}

            <div className="flex w-full items-center justify-between py-1">

              <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                  disabled={loading}
                  className="h-5 w-5 cursor-pointer rounded border-zinc-300 accent-orange-600"
                />

                <span>
                  Remember me
                </span>

              </label>

              <Link
  href="/forgot-password"
  className="text-xs font-medium text-orange-700"
>
  Forgot Password?
</Link>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="group flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-600 via-orange-600 to-red-600 font-semibold text-white shadow-[0_10px_25px_rgba(234,88,12,0.32)] transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                "Logging In..."
              ) : (
                <>
                  <span>
                    Log In
                  </span>

                  <ArrowRight
                    size={21}
                    className="ml-3"
                  />
                </>
              )}

            </button>

          </form>

          {/* DIVIDER */}

          <div className="my-5 flex w-full items-center gap-3">

            <div className="h-px flex-1 bg-zinc-200" />

            <span className="whitespace-nowrap text-xs text-zinc-500">
              or continue with
            </span>

            <div className="h-px flex-1 bg-zinc-200" />

          </div>

          {/* GOOGLE LOGIN */}

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleLogin}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
          >

            <GoogleIcon />

            <span>
              Continue with Google
            </span>

          </button>

          {/* SIGNUP */}

          <p className="mt-5 pb-2 text-center text-xs text-zinc-600">

            Don't have an account?{" "}

            <Link
              href="/signup"
              className="font-semibold text-orange-700"
            >
              Sign up
            </Link>

          </p>

        </section>

      </div>

    </main>
  );
}

/* ============================================================
   GOOGLE ICON
============================================================ */

function GoogleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >

      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.78h3.14c1.84-1.7 2.92-4.2 2.92-7.74Z"
      />

      <path
        fill="#34A853"
        d="M12 21.75c2.62 0 4.82-.87 6.43-2.36l-3.14-2.78c-.87.58-1.98.92-3.29.92-2.53 0-4.67-1.7-5.44-4v2.86H3.32v2.87A9.72 9.72 0 0 0 12 21.75Z"
      />

      <path
        fill="#FBBC05"
        d="M6.56 13.53A5.84 5.84 0 0 1 6.25 12c0-.53.11-1.04.31-1.53V7.61H3.32A9.72 9.72 0 0 0 2.25 12c0 1.57.38 3.05 1.07 4.39l3.24-2.86Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.47c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.81 3.54 14.62 2.25 12 2.25a9.72 9.72 0 0 0-8.68 5.36l3.24 2.86c.77-2.3 2.91-4 5.44-4Z"
      />

    </svg>
  );
}