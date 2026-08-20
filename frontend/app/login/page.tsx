"use client";

import toast from "react-hot-toast";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession, clearAllSessions } from "@/app/lib/auth/session";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const adminSession = localStorage.getItem(
      "campusvita_admin_session"
    );
  
    const userSession = localStorage.getItem(
      "campusvita_user_session"
    );
  
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
  
        if (session?.user?.role === "ADMIN") {
          router.replace("/admin/dashboard");
          return;
        }
      } catch {
        localStorage.removeItem("campusvita_admin_session");
      }
    }
  
    if (userSession) {
      try {
        const session = JSON.parse(userSession);
  
        if (session?.user?.role === "USER") {
          router.replace("/");
          return;
        }
      } catch {
        localStorage.removeItem("campusvita_user_session");
      }
    }
  }, [router]);

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

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(jsonError);
        toast.error("Server returned an unexpected response");
        return;
      }

      if (response.ok && data.message === "Login Successful 🚀") {
        // Clear any old active session first
clearAllSessions();

// Save the authenticated user into the correct role session
saveSession({
  accessToken: data.access_token,
  refreshToken: data.refresh_token,
  tokenType: data.token_type,
  expiresIn: Number(data.expires_in),
  user: {
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
    phone: data.user.phone || "",
    department: data.user.department || "",
    year: data.user.year || "",
    profile_image: data.user.profile_image || "",
  },
});

        toast.success(data.message);
        if (data.user.role === "ADMIN") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/");
        }
      } else {
        toast.error(data.message || data.detail || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Backend Server Not Running");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="bg-zinc-900 p-10 rounded-3xl w-full max-w-md shadow-2xl border border-zinc-800">
        <h1 className="text-5xl font-bold text-orange-500">Login</h1>
        <p className="text-gray-400 mt-3">Welcome back to CampusVita 🚀</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-5 mt-10">
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            aria-label="Email"
            className="p-4 rounded-2xl bg-zinc-800 text-white outline-none border border-zinc-700 focus:border-orange-500 disabled:opacity-50"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              aria-label="Password"
              className="p-4 rounded-2xl bg-zinc-800 text-white outline-none border border-zinc-700 focus:border-orange-500 disabled:opacity-50 w-full pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-orange-500"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 py-4 rounded-2xl mt-3 hover:bg-orange-600 transition-all disabled:opacity-50"
          >
            {loading ? "Logging In..." : "Login"}
          </button>

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