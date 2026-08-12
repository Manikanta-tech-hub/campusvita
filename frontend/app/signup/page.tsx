"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");

  // ============================================================
  // CONVERT ANY BACKEND ERROR INTO A SAFE STRING
  // ============================================================

  const getErrorMessage = (data: any): string => {
    // FastAPI validation errors normally look like:
    //
    // {
    //   detail: [
    //     {
    //       type: "...",
    //       loc: [...],
    //       msg: "...",
    //       input: "...",
    //       ctx: {...}
    //     }
    //   ]
    // }

    if (!data) {
      return "Signup failed";
    }

    // detail is an array
    if (Array.isArray(data.detail)) {
      const messages = data.detail
        .map((error: any) => {
          if (typeof error === "string") {
            return error;
          }

          if (
            error &&
            typeof error.msg === "string"
          ) {
            return error.msg;
          }

          if (
            error &&
            typeof error.message === "string"
          ) {
            return error.message;
          }

          // Last-resort conversion.
          // This prevents React from receiving an object.
          try {
            return JSON.stringify(error);
          } catch {
            return "Invalid input";
          }
        })
        .filter(Boolean);

      if (messages.length > 0) {
        return messages.join(", ");
      }
    }

    // detail is already a string
    if (typeof data.detail === "string") {
      return data.detail;
    }

    // message is a string
    if (typeof data.message === "string") {
      return data.message;
    }

    // error is a string
    if (typeof data.error === "string") {
      return data.error;
    }

    return "Signup failed";
  };

  // ============================================================
  // HANDLE SIGNUP
  // ============================================================

  const handleSignup = async () => {
    // ----------------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------------

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !phone.trim() ||
      !department.trim() ||
      !year
    ) {
      toast.error("Please fill all fields");
      return;
    }

    // ----------------------------------------------------------
    // EMAIL VALIDATION
    // ----------------------------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    // ----------------------------------------------------------
    // PASSWORD VALIDATION
    // ----------------------------------------------------------

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!passwordRegex.test(password)) {
      toast.error(
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character"
      );
      return;
    }

    try {
      setLoading(true);

      // --------------------------------------------------------
      // SEND REQUEST TO FASTAPI
      // --------------------------------------------------------

      const response = await fetch(
        "http://127.0.0.1:8000/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            phone: phone.trim(),
            department: department.trim(),
            year,
          }),
        }
      );

      // --------------------------------------------------------
      // READ RESPONSE SAFELY
      // --------------------------------------------------------

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      console.log(
        "Signup status:",
        response.status
      );

      console.log(
        "Signup response:",
        data
      );

      // --------------------------------------------------------
      // BACKEND ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        const errorMessage =
          getErrorMessage(data);

        toast.error(errorMessage);

        return;
      }

      // --------------------------------------------------------
      // SIGNUP SUCCESS
      // --------------------------------------------------------

      const successMessage =
        typeof data?.message === "string"
          ? data.message
          : "";

      if (
        response.status >= 200 &&
        response.status < 300
      ) {
        toast.success(
          successMessage ||
            "Account Created Successfully 🚀"
        );

        // Small delay so the toast can be seen.
        setTimeout(() => {
          router.replace("/login");
        }, 700);

        return;
      }

      // --------------------------------------------------------
      // UNKNOWN RESPONSE
      // --------------------------------------------------------

      toast.error(
        "Unexpected response from server"
      );
    } catch (error) {
      console.error(
        "Signup error:",
        error
      );

      toast.error(
        "Unable to connect to backend"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6 py-10">
      <div className="bg-zinc-900 p-10 rounded-[40px] w-full max-w-2xl border border-zinc-800 shadow-2xl">

        {/* ======================================================
            TITLE
        ====================================================== */}

        <h1 className="text-6xl font-bold text-orange-500">
          Signup
        </h1>

        <p className="text-gray-400 mt-4 text-lg">
          Create your CampusVita account 🚀
        </p>

        {/* ======================================================
            FORM
        ====================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10">

          {/* FULL NAME */}

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            disabled={loading}
            autoComplete="name"
            className="bg-zinc-800 p-5 rounded-2xl outline-none text-white border border-zinc-700 focus:border-orange-500 disabled:opacity-50"
          />

          {/* EMAIL */}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            disabled={loading}
            autoComplete="email"
            className="bg-zinc-800 p-5 rounded-2xl outline-none text-white border border-zinc-700 focus:border-orange-500 disabled:opacity-50"
          />

          {/* PASSWORD */}

          <input
            type="password"
            placeholder="Password (8+ chars, A-Z, a-z, 0-9, special)"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            disabled={loading}
            autoComplete="new-password"
            title="Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character"
            className="bg-zinc-800 p-5 rounded-2xl outline-none text-white border border-zinc-700 focus:border-orange-500 disabled:opacity-50"
          />

          {/* PHONE */}

          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            disabled={loading}
            autoComplete="tel"
            className="bg-zinc-800 p-5 rounded-2xl outline-none text-white border border-zinc-700 focus:border-orange-500 disabled:opacity-50"
          />

          {/* DEPARTMENT */}

          <input
            type="text"
            placeholder="Department / Branch"
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
            disabled={loading}
            className="bg-zinc-800 p-5 rounded-2xl outline-none text-white border border-zinc-700 focus:border-orange-500 disabled:opacity-50"
          />

          {/* YEAR */}

          <select
            value={year}
            onChange={(e) =>
              setYear(e.target.value)
            }
            disabled={loading}
            className="bg-zinc-800 p-5 rounded-2xl outline-none text-white border border-zinc-700 focus:border-orange-500 disabled:opacity-50"
          >
            <option value="">
              Select Year
            </option>

            <option value="1st Year">
              1st Year
            </option>

            <option value="2nd Year">
              2nd Year
            </option>

            <option value="3rd Year">
              3rd Year
            </option>

            <option value="4th Year">
              4th Year
            </option>
          </select>
        </div>

        {/* ======================================================
            BUTTON
        ====================================================== */}

        <button
          type="button"
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 transition-all py-5 rounded-2xl mt-10 text-2xl font-bold text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Creating Account..."
            : "Create Account"}
        </button>
      </div>
    </main>
  );
}