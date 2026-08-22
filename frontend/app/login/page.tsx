"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { saveSession } from "@/app/lib/auth/session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
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
            "Content-Type": "application/json",
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

      if (
        response.ok &&
        data.message === "Login Successful 🚀"
      ) {
        const role = data?.user?.role;

        // ------------------------------------------------------
        // Validate role
        // ------------------------------------------------------

        if (
          role !== "ADMIN" &&
          role !== "USER"
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

        // ------------------------------------------------------
        // Validate access token
        // ------------------------------------------------------

        if (!data.access_token) {
          console.error(
            "Login response does not contain access_token"
          );

          toast.error(
            "Login failed: access token missing"
          );

          return;
        }

        // ======================================================
        // IMPORTANT
        //
        // DO NOT clear ADMIN or USER sessions here.
        //
        // Both sessions are independent:
        //
        // ADMIN → campusvita_admin_session
        // USER  → campusvita_user_session
        //
        // Logging in as USER must NOT remove ADMIN.
        // Logging in as ADMIN must NOT remove USER.
        //
        // saveSession() automatically writes only to the
        // namespace belonging to the authenticated role.
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

        // ------------------------------------------------------
        // Verify the correct namespace was created
        // ------------------------------------------------------

        console.log(
          `CampusVita ${role} session created`
        );

        // ======================================================
        // SUCCESS MESSAGE
        // ======================================================

        toast.success(data.message);

        // ======================================================
        // ROLE-BASED REDIRECT
        // ======================================================

        if (role === "ADMIN") {
          router.replace("/admin/dashboard");
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
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md shadow-2xl border border-zinc-800">

        <h1 className="text-5xl font-bold text-orange-500">
          Login
        </h1>

        <p className="text-gray-400 mt-3">
          Welcome back to CampusVita 🚀
        </p>

        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-5 mt-10"
        >

          {/* ==================================================
              EMAIL
          ================================================== */}

          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            disabled={loading}
            autoComplete="email"
            aria-label="Email"
            className="p-4 rounded-2xl bg-zinc-800 text-white outline-none border border-zinc-700 focus:border-orange-500 disabled:opacity-50"
          />

          {/* ==================================================
              PASSWORD
          ================================================== */}

          <div className="relative">

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              placeholder="Enter Password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              disabled={loading}
              autoComplete="current-password"
              aria-label="Password"
              className="p-4 rounded-2xl bg-zinc-800 text-white outline-none border border-zinc-700 focus:border-orange-500 disabled:opacity-50 w-full pr-16"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (previous) =>
                    !previous
                )
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-orange-500"
            >
              {showPassword
                ? "Hide"
                : "Show"}
            </button>

          </div>

          {/* ==================================================
              LOGIN BUTTON
          ================================================== */}

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 py-4 rounded-2xl mt-3 hover:bg-orange-600 transition-all disabled:opacity-50"
          >
            {loading
              ? "Logging In..."
              : "Login"}
          </button>

          {/* ==================================================
              SIGNUP
          ================================================== */}

          <Link href="/signup">
            <button
              type="button"
              className="w-full bg-zinc-800 py-4 rounded-2xl hover:bg-zinc-700 transition-all"
            >
              Create New Account
            </button>
          </Link>

        </form>
      </div>
    </main>
  );
}