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
  UserPlus,
  ShieldCheck,
  Zap,
  Gift,
  type LucideIcon,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/* =========================================================
   TYPES
========================================================= */

type FieldProps = {
  label?: string;
  value: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  icon: LucideIcon;
  disabled?: boolean;
  onChange: (value: string) => void;
  rightElement?: ReactNode;
  mobile?: boolean;
};

type SignupFormProps = {
  mobile?: boolean;
  name: string;
  email: string;
  password: string;
  phone: string;
  loading: boolean;
  showPassword: boolean;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setPhone: (value: string) => void;
  setShowPassword: (value: boolean) => void;
  handleSignup: () => Promise<void>;
  router: ReturnType<typeof useRouter>;
};

/* =========================================================
   INPUT FIELD
========================================================= */

function Field({
  label,
  value,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  icon: Icon,
  disabled,
  onChange,
  rightElement,
  mobile = false,
}: FieldProps) {
  return (
    <label className="group block w-full min-w-0">
      {!mobile && label && (
        <span className="mb-2 block text-[13px] font-semibold text-[#302d2a]">
          {label}
        </span>
      )}

      <div
        className={`
          relative flex w-full min-w-0 items-center
          rounded-2xl
          border border-[#dedbd6]
          bg-white
          shadow-[0_3px_12px_rgba(0,0,0,0.025)]
          transition-all duration-200
          group-focus-within:border-orange-400
          group-focus-within:ring-4
          group-focus-within:ring-orange-100
          ${mobile ? "h-[62px] px-5" : "h-[64px] px-5"}
        `}
      >
        <Icon
          size={mobile ? 22 : 21}
          strokeWidth={1.7}
          className="
            mr-4
            shrink-0
            text-[#77736f]
            transition-colors
            group-focus-within:text-orange-500
          "
        />

        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          className="
            min-w-0
            flex-1
            bg-transparent
            text-[16px]
            text-[#292725]
            outline-none
            placeholder:text-[#77736f]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        />

        {rightElement}
      </div>
    </label>
  );
}

/* =========================================================
   SIGNUP PAGE
========================================================= */

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  /* =========================================================
     ERROR MESSAGE
  ========================================================= */

  const getErrorMessage = (data: unknown): string => {
    if (!data || typeof data !== "object") {
      return "Signup failed";
    }

    const responseData = data as {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };

    if (Array.isArray(responseData.detail)) {
      const messages = responseData.detail
        .map((error: unknown) => {
          if (typeof error === "string") {
            return error;
          }

          if (
            error &&
            typeof error === "object" &&
            "msg" in error &&
            typeof error.msg === "string"
          ) {
            return error.msg;
          }

          if (
            error &&
            typeof error === "object" &&
            "message" in error &&
            typeof error.message === "string"
          ) {
            return error.message;
          }

          return "Invalid input";
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }

    if (typeof responseData.detail === "string") {
      return responseData.detail;
    }

    if (typeof responseData.message === "string") {
      return responseData.message;
    }

    if (typeof responseData.error === "string") {
      return responseData.error;
    }

    return "Signup failed";
  };

  /* =========================================================
     SIGNUP HANDLER
  ========================================================= */

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

    const cleanPhone = phone.trim();

    if (
      !/^\d{10}$/.test(cleanPhone) ||
      !/^[6789]/.test(cleanPhone)
    ) {
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
          phone: cleanPhone,
        }),
      });

      let data: unknown = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        toast.error(getErrorMessage(data));
        return;
      }

      const successData = data as {
        message?: string;
      } | null;

      toast.success(
        successData?.message || "Account Created Successfully 🚀"
      );

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
    <main
      className="
        relative
        min-h-[100dvh]
        w-full
        max-w-[100vw]
        overflow-x-hidden
        bg-[#1a1715]
        text-[#292725]
      "
    >

      {/* =====================================================
          DESKTOP
      ====================================================== */}

      <div
        className="
          relative
          hidden
          h-[100dvh]
          w-full
          max-w-[100vw]
          overflow-hidden
          isolate
          lg:block
        "
      >

        {/* =================================================
            FULL SCREEN BACKGROUND IMAGE
        ================================================= */}

        <div className="absolute inset-0 overflow-hidden">

          <img
            src="/cafe.jpg"
            alt="Campus cafe"
            className="
              block
              h-full
              w-full
              min-w-full
              object-cover
              object-center
            "
          />

        </div>

        {/* DARK OVERLAY */}

        <div className="absolute inset-0 bg-black/35" />

        {/* =================================================
            DESKTOP CONTENT
        ================================================= */}

        <div
          className="
            relative
            z-10
            grid
            h-full
            w-full
            max-w-full
            grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]
            gap-8
            overflow-hidden
            px-8
            py-[2.5vh]
            xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)]
            xl:px-12
          "
        >

          {/* =================================================
              LEFT SIDE
          ================================================= */}

          <section className="relative flex h-full min-w-0 flex-col">

            {/* LOGO */}

            <div className="pt-5 text-[28px] font-bold tracking-[-0.05em] text-white">
              Campus
              <span className="text-orange-500">
                Vita
              </span>
            </div>

            {/* HERO */}

            <div className="my-auto max-w-[760px] pb-10">

              <div className="mb-7 h-[4px] w-12 rounded-full bg-orange-500" />

              <h1
                className="
                  text-[50px]
                  font-bold
                  leading-[1.1]
                  tracking-[-0.045em]
                  text-white
                  xl:text-[62px]
                "
              >
                Join{" "}

                <span className="text-orange-500">
                  CampusVita
                </span>

              </h1>

              <p
                className="
                  mt-3
                  text-[38px]
                  font-semibold
                  leading-[1.2]
                  tracking-[-0.04em]
                  text-white
                  xl:text-[50px]
                "
              >
                Made for Students.
                <br />
                Built for Campus Life.
              </p>

            </div>

            {/* FEATURES */}

            <div
              className="
                mb-5
                flex
                w-full
                min-w-0
                gap-4
                rounded-[26px]
                bg-black/50
                p-5
                backdrop-blur-md
                xl:gap-5
              "
            >

              <Feature
                icon={ShieldCheck}
                title="Secure & Safe"
                description="Your data is encrypted and protected."
              />

              <Feature
                icon={Zap}
                title="Fast & Easy"
                description="Quick signup and get started."
              />

              <Feature
                icon={Gift}
                title="Exciting Offers"
                description="Exclusive deals and rewards for students."
              />

            </div>

          </section>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <section
            className="
              flex
              h-full
              min-w-0
              max-w-full
              items-center
              justify-center
            "
          >

            <div
              className="
                flex
                h-[95dvh]
                w-full
                max-w-[620px]
                min-w-0
                flex-col
                justify-center
                overflow-y-auto
                overflow-x-hidden
                rounded-[34px]
                bg-[#fbfaf9]
                px-8
                py-8
                shadow-[0_25px_80px_rgba(0,0,0,0.28)]
                xl:px-12
                xl:py-10
              "
            >

              <SignupForm
                name={name}
                email={email}
                password={password}
                phone={phone}
                loading={loading}
                showPassword={showPassword}
                setName={setName}
                setEmail={setEmail}
                setPassword={setPassword}
                setPhone={setPhone}
                setShowPassword={setShowPassword}
                handleSignup={handleSignup}
                router={router}
              />

            </div>

          </section>

        </div>

      </div>

      {/* =====================================================
          MOBILE
      ====================================================== */}

      <div
        className="
          relative
          min-h-[100dvh]
          w-full
          max-w-[100vw]
          overflow-x-hidden
          isolate
          lg:hidden
        "
      >

        {/* =================================================
            MOBILE BACKGROUND IMAGE
        ================================================= */}

        <div
          className="
            absolute
            inset-x-0
            top-0
            h-[42dvh]
            w-full
            overflow-hidden
          "
        >

          <img
            src="/cafe.jpg"
            alt="Campus cafe"
            className="
              block
              h-full
              w-full
              min-w-full
              object-cover
              object-center
            "
          />

          <div className="absolute inset-0 bg-black/30" />

        </div>

        {/* =================================================
            MOBILE LOGO
        ================================================= */}

        <div
          className="
            absolute
            inset-x-0
            top-0
            z-10
            w-full
            px-7
            pt-8
          "
        >

          <div className="text-[27px] font-bold tracking-[-0.05em] text-white">

            Campus

            <span className="text-orange-500">
              Vita
            </span>

          </div>

        </div>

        {/* =================================================
            MOBILE FORM AREA
        ================================================= */}

        <div
          className="
            relative
            z-20
            w-full
            max-w-full
            pt-[35dvh]
          "
        >

          <section
            className="
              min-h-[65dvh]
              w-full
              max-w-full
              overflow-x-hidden
              rounded-t-[38px]
              bg-[#fbfaf9]
              px-6
              pb-12
              pt-5
              shadow-[0_-12px_40px_rgba(0,0,0,0.18)]
            "
          >

            {/* HANDLE */}

            <div className="mb-6 flex justify-center">

              <div className="h-1.5 w-12 rounded-full bg-[#d7d2cc]" />

            </div>

            {/* FORM */}

            <SignupForm
              mobile
              name={name}
              email={email}
              password={password}
              phone={phone}
              loading={loading}
              showPassword={showPassword}
              setName={setName}
              setEmail={setEmail}
              setPassword={setPassword}
              setPhone={setPhone}
              setShowPassword={setShowPassword}
              handleSignup={handleSignup}
              router={router}
            />

          </section>

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   SIGNUP FORM
========================================================= */

function SignupForm({
  mobile = false,
  name,
  email,
  password,
  phone,
  loading,
  showPassword,
  setName,
  setEmail,
  setPassword,
  setPhone,
  setShowPassword,
  handleSignup,
  router,
}: SignupFormProps) {
  return (
    <div className="w-full min-w-0 max-w-full">

      {/* HEADER */}

      <div className={`text-center ${mobile ? "mb-5" : "mb-7"}`}>

        {/* ICON */}

        <div className="mb-4 flex justify-center">

          <div
            className={`
              flex items-center justify-center
              rounded-full
              bg-white
              text-orange-600
              shadow-[0_5px_20px_rgba(0,0,0,0.10)]
              ${
                mobile
                  ? "h-[58px] w-[58px]"
                  : "h-[68px] w-[68px]"
              }
            `}
          >

            <UserPlus
              size={mobile ? 27 : 32}
              strokeWidth={1.8}
            />

          </div>

        </div>

        {/* TITLE */}

        <h2
          className={`
            font-bold
            tracking-[-0.045em]
            text-[#202020]
            ${
              mobile
                ? "text-[29px]"
                : "text-[34px] xl:text-[42px]"
            }
          `}
        >

          <span className="text-orange-600">
            Create
          </span>{" "}

          your account

        </h2>

        {/* SUBTITLE */}

        <p
          className={`
            mt-2
            text-[#77736f]
            ${mobile ? "text-[15px]" : "text-[17px]"}
          `}
        >
          Let&apos;s get you started 🚀
        </p>

      </div>

      {/* =====================================================
          FIELDS
      ====================================================== */}

      <div className={mobile ? "space-y-3" : "space-y-3.5"}>

        <Field
          mobile={mobile}
          label="Full Name"
          value={name}
          placeholder="Full Name"
          autoComplete="name"
          icon={User}
          disabled={loading}
          onChange={setName}
        />

        <Field
          mobile={mobile}
          label="Email Address"
          value={email}
          placeholder="Email Address"
          type="email"
          autoComplete="email"
          inputMode="email"
          icon={Mail}
          disabled={loading}
          onChange={setEmail}
        />

        <Field
          mobile={mobile}
          label="Password"
          value={password}
          placeholder="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          icon={LockKeyhole}
          disabled={loading}
          onChange={setPassword}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              className="
                ml-3
                shrink-0
                text-[#77736f]
                transition
                hover:text-orange-500
                disabled:cursor-not-allowed
              "
            >
              {showPassword ? (
                <EyeOff size={21} />
              ) : (
                <Eye size={21} />
              )}
            </button>
          }
        />

        <Field
          mobile={mobile}
          label="Phone Number"
          value={phone}
          placeholder="Phone Number"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          icon={Phone}
          disabled={loading}
          onChange={(value) => {
            setPhone(
              value.replace(/\D/g, "").slice(0, 10)
            );
          }}
        />

      </div>

      {/* =====================================================
          CREATE ACCOUNT
      ====================================================== */}

      <button
        type="button"
        onClick={handleSignup}
        disabled={loading}
        className={`
          flex
          w-full
          items-center
          justify-center
          gap-3
          rounded-2xl
          bg-[#f04b00]
          font-bold
          text-white
          shadow-[0_12px_25px_rgba(240,75,0,0.28)]
          transition-all
          hover:bg-[#dc4400]
          active:scale-[0.99]
          disabled:cursor-not-allowed
          disabled:opacity-60
          ${
            mobile
              ? "mt-5 h-[62px] text-[17px]"
              : "mt-5 h-[64px] text-[17px]"
          }
        `}
      >

        {loading
          ? "Creating Account..."
          : "Create Account"}

        {!loading && <ArrowRight size={23} />}

      </button>

      {/* =====================================================
          DIVIDER
      ====================================================== */}

      <div className="my-5 flex items-center gap-4">

        <div className="h-px min-w-0 flex-1 bg-[#dedad5]" />

        <span className="whitespace-nowrap text-sm text-[#77736f]">
          or continue with
        </span>

        <div className="h-px min-w-0 flex-1 bg-[#dedad5]" />

      </div>

      {/* =====================================================
          GOOGLE
      ====================================================== */}

      <button
        type="button"
        disabled
        className="
          flex
          h-[60px]
          w-full
          items-center
          justify-center
          gap-3
          rounded-2xl
          border
          border-[#e2ddd7]
          bg-white
          text-[16px]
          font-semibold
          text-[#292725]
          opacity-70
        "
      >

        <GoogleIcon />

        Google

      </button>

      {/* =====================================================
          LOGIN
      ====================================================== */}

      <p
        className={`
          pb-2
          text-center
          text-[15px]
          text-[#77736f]
          ${mobile ? "mt-6" : "mt-5"}
        `}
      >

        Already have an account?{" "}

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="
            font-bold
            text-orange-600
            transition
            hover:text-orange-700
          "
        >
          Sign in
        </button>

      </p>

    </div>
  );
}

/* =========================================================
   FEATURE
========================================================= */

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
    <div className="flex min-w-0 flex-1 items-start gap-3">

      <div
        className="
          flex
          h-14
          w-14
          shrink-0
          items-center
          justify-center
          rounded-2xl
          bg-orange-500/20
          text-orange-400
        "
      >

        <Icon
          size={28}
          strokeWidth={1.8}
        />

      </div>

      <div className="min-w-0">

        <p className="text-[15px] font-bold text-white">
          {title}
        </p>

        <p className="mt-1 text-[13px] leading-5 text-white/80">
          {description}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   GOOGLE ICON
========================================================= */

function GoogleIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.23a4.47 4.47 0 0 1-1.94 2.93v2.78h3.14c1.84-1.69 2.92-4.18 2.92-7.74Z"
      />

      <path
        fill="#34A853"
        d="M12 21.75c2.62 0 4.82-.87 6.43-2.35l-3.14-2.43c-.87.58-1.99.92-3.29.92-2.53 0-4.67-1.71-5.44-4v2.86H3.32v2.52A9.72 9.72 0 0 0 12 21.75Z"
      />

      <path
        fill="#FBBC05"
        d="M6.56 13.89A5.84 5.84 0 0 1 6.25 12c0-.66.11-1.3.31-1.89V7.25H3.32A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.07 4.75l3.24-2.86Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.11c1.42 0 2.69.49 3.69 1.45l2.77-2.77C16.81 3.24 14.61 2.25 12 2.25a9.72 9.72 0 0 0-8.68 5l3.24 2.86c.77-2.29 2.91-4 5.44-4Z"
      />
    </svg>
  );
}