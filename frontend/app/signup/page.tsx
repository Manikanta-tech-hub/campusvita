"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  Phone,
  User,
  ShieldCheck,
  Zap,
  Gift,
  type LucideIcon,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type FieldProps = {
  label: string;
  hint: string;
  value: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  icon: LucideIcon;
  disabled?: boolean;
  onChange: (value: string) => void;
  rightElement?: ReactNode;
};

function Field({
  label,
  hint,
  value,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  icon: Icon,
  disabled,
  onChange,
  rightElement,
}: FieldProps) {
  return (
    <label className="group block">
      <span className="sr-only">{label}</span>

      <div className="relative flex min-h-[76px] items-center rounded-2xl border border-white/[0.08] bg-[#111214]/90 px-4 transition duration-200 group-focus-within:border-orange-500/60 group-focus-within:bg-[#141517] group-focus-within:shadow-[0_0_0_4px_rgba(249,115,22,0.06)]">
        <div className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025] text-zinc-400 transition group-focus-within:border-orange-500/20 group-focus-within:text-orange-400">
          <Icon size={20} strokeWidth={1.7} />
        </div>

        <div className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium text-zinc-200">
            {label}
          </span>

          <input
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete}
            inputMode={inputMode}
            disabled={disabled}
            className="mt-0.5 w-full bg-transparent text-[14px] text-white outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {rightElement}
      </div>

      <span className="mt-1.5 block pl-1 text-[11px] leading-4 text-zinc-600">
        {hint}
      </span>
    </label>
  );
}

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const getErrorMessage = (data: any): string => {
    if (!data) return "Signup failed";

    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((error: any) => {
          if (typeof error === "string") return error;
          if (error && typeof error.msg === "string") return error.msg;
          if (error && typeof error.message === "string") return error.message;

          try {
            return JSON.stringify(error);
          } catch {
            return "Invalid input";
          }
        })
        .filter(Boolean);

      if (messages.length > 0) return messages.join(", ");
    }

    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;

    return "Signup failed";
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password || !phone.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character"
      );
      return;
    }

    if (!/^\d{10}$/.test(phone.trim()) || !/^[6789]/.test(phone.trim())) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
        }),
      });

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log("Signup status:", response.status);
      console.log("Signup response:", data);

      if (!response.ok) {
        toast.error(getErrorMessage(data));
        return;
      }

      const successMessage =
        typeof data?.message === "string" ? data.message : "";

      toast.success(successMessage || "Account Created Successfully 🚀");

      window.setTimeout(() => {
        router.replace("/login");
      }, 700);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Unable to connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <div className="relative min-h-screen lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(480px,0.9fr)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_45%,rgba(249,115,22,0.07),transparent_30%),radial-gradient(circle_at_10%_100%,rgba(249,115,22,0.05),transparent_32%)]" />

        <section className="relative hidden min-h-screen overflow-hidden border-r border-white/[0.06] lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
          <div>
            <div className="text-[21px] font-semibold tracking-[-0.03em]">
              Campus<span className="text-orange-500">Vita</span>
            </div>

            <div className="mt-24 max-w-xl">
              <h1 className="text-[48px] font-semibold leading-[1.05] tracking-[-0.045em] xl:text-[56px]">
                Join <span className="text-orange-500">CampusVita</span>
                <br />
                Your Campus,
                <br />
                Your Way
              </h1>

              <p className="mt-7 max-w-md text-[16px] leading-7 text-zinc-400">
                Create your account and enjoy seamless food ordering,
                exciting offers, and a better campus life.
              </p>

              <div className="mt-10 space-y-5">
                <Feature
                  icon={ShieldCheck}
                  title="Secure & Safe"
                  description="Your data is encrypted and protected."
                />
                <Feature
                  icon={Zap}
                  title="Fast & Easy"
                  description="Quick signup and get started in seconds."
                />
                <Feature
                  icon={Gift}
                  title="Exciting Offers"
                  description="Exclusive deals and rewards for students."
                />
              </div>
            </div>
          </div>

          <div className="relative h-44 overflow-hidden">
            <div className="absolute bottom-0 left-0 h-32 w-40 rounded-t-[70px] border border-orange-500/10 bg-gradient-to-t from-[#090b0d] to-[#121518]" />
            <div className="absolute bottom-0 left-28 h-44 w-36 rounded-t-[90px] border border-orange-500/10 bg-gradient-to-t from-[#080a0c] to-[#15191c]" />
            <div className="absolute bottom-0 left-60 h-24 w-52 rounded-t-[50px] border border-orange-500/10 bg-gradient-to-t from-[#090b0d] to-[#121619]" />
            <div className="absolute bottom-0 left-72 h-40 w-4 bg-orange-500/15 blur-md" />
            <div className="absolute bottom-0 right-0 h-px w-[78%] bg-gradient-to-r from-orange-500/50 to-transparent" />
          </div>

          <p className="absolute bottom-8 left-12 text-xs leading-5 text-zinc-600 xl:left-16">
            Your privacy is important to us.
            <br />
            We never share your personal data.
          </p>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-10 xl:px-16">
          <div className="w-full max-w-[540px]">
            <div className="mb-8 lg:hidden">
              <div className="text-[20px] font-semibold tracking-[-0.03em]">
                Campus<span className="text-orange-500">Vita</span>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/[0.10] bg-[#0d0f11]/95 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8 xl:p-10">
              <div className="mb-8">
                <h2 className="text-[30px] font-semibold tracking-[-0.035em] sm:text-[34px]">
                  <span className="text-orange-500">Create</span> your account
                </h2>
                <p className="mt-2 text-sm text-zinc-500 sm:text-[15px]">
                  Let&apos;s get you started 🚀
                </p>
              </div>

              <div className="space-y-4">
                <Field
                  label="Full Name"
                  hint="Enter your full name"
                  value={name}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  icon={User}
                  disabled={loading}
                  onChange={setName}
                />

                <Field
                  label="Email Address"
                  hint="Enter your email address"
                  value={email}
                  placeholder="Enter your email address"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  icon={Mail}
                  disabled={loading}
                  onChange={setEmail}
                />

                <Field
                  label="Password"
                  hint="8+ chars · A-Z · a-z · 0-9 · special character"
                  value={password}
                  placeholder="Create a strong password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  icon={LockKeyhole}
                  disabled={loading}
                  onChange={setPassword}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={loading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  }
                />

                <Field
                  label="Phone Number"
                  hint="Enter your 10-digit mobile number"
                  value={phone}
                  placeholder="Enter your phone number"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  icon={Phone}
                  disabled={loading}
                  onChange={setPhone}
                />
              </div>

              <button
                type="button"
                onClick={handleSignup}
                disabled={loading}
                className="mt-7 flex min-h-[58px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-5 text-[16px] font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.18)] transition duration-200 hover:-translate-y-0.5 hover:from-orange-400 hover:to-orange-500 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating Account..." : "Create Account"}
                {!loading && <ArrowRight size={20} />}
              </button>

              <div className="mt-7 flex items-center gap-3 text-xs text-zinc-600">
                <span className="h-px flex-1 bg-white/[0.08]" />
                <span>Secure account creation</span>
                <span className="h-px flex-1 bg-white/[0.08]" />
              </div>

              <p className="mt-7 text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="font-medium text-orange-500 transition hover:text-orange-400"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-orange-500/15 bg-orange-500/[0.045] text-orange-500 shadow-[0_10px_30px_rgba(249,115,22,0.05)]">
        <Icon size={25} strokeWidth={1.7} />
      </div>

      <div>
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}
