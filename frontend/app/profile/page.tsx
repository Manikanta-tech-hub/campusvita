"use client";

import toast from "react-hot-toast";

import {
  Camera,
  Save,
  LogOut,
  Moon,
  Bell,
  ShoppingBag,
  Heart,
  Wallet,
} from "lucide-react";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/components/layout/Navbar";

export default function ProfilePage() {
  const router = useRouter();

  const API_URL = "http://127.0.0.1:8000";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");

  const [profileImage, setProfileImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("dark");

  const [wallet, setWallet] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [favorites, setFavorites] = useState(0);

  // ============================================================
  // LOAD LIVE PROFILE
  // ============================================================

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("token_type");
          localStorage.removeItem("expires_in");
          localStorage.removeItem("isLoggedIn");
          localStorage.removeItem("userEmail");
          localStorage.removeItem("email");
          localStorage.removeItem("userName");
          localStorage.removeItem("userRole");

          toast.error("Session expired. Please login again.");
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          throw new Error(
            errorData.detail ||
              errorData.message ||
              "Failed to load profile"
          );
        }

        const data = await response.json();

        console.log("LIVE PROFILE DATA:", data);

        // ======================================================
        // ONLY USE DATA RETURNED BY BACKEND
        // ======================================================

        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setDepartment(data.department ?? "");
        setYear(data.year ?? "");

        setProfileImage(data.profile_image ?? "");

        setNotifications(data.notifications ?? true);
        setTheme(data.theme ?? "dark");

        setWallet(Number(data.wallet ?? 0));
        setTotalOrders(Number(data.total_orders ?? 0));
        setTotalSpent(Number(data.total_spent ?? 0));

        // Backend should provide favorite_foods or favorites_count.
        if (typeof data.favorites_count === "number") {
          setFavorites(data.favorites_count);
        } else if (Array.isArray(data.favorite_foods)) {
          setFavorites(data.favorite_foods.length);
        } else {
          setFavorites(0);
        }

        // Keep login information synchronized with backend data.
        if (data.email) {
          localStorage.setItem("userEmail", data.email);
          localStorage.setItem("email", data.email);
        }

        if (data.name) {
          localStorage.setItem("userName", data.name);
        }
      } catch (error) {
        console.error("Profile loading error:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load profile"
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      toast.error("Please login again.");
      router.replace("/login");
      return;
    }

    try {
      setSaving(true);

      let imageUrl = profileImage;

      // ========================================================
      // UPLOAD NEW PROFILE IMAGE
      // ========================================================

      if (imageFile) {
        const formData = new FormData();

        formData.append("file", imageFile);

        const uploadResponse = await fetch(
          `${API_URL}/upload-profile-image`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.detail ||
              errorData.message ||
              "Profile image upload failed"
          );
        }

        const uploadData = await uploadResponse.json();

        imageUrl = uploadData.image_url || profileImage;
      }

      // ========================================================
      // UPDATE PROFILE
      // IMPORTANT: backend endpoint is PUT /profile
      // ========================================================

      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          department: department.trim(),
          year,
          profile_image: imageUrl,
          notifications,
          theme,
        }),
      });

      if (response.status === 401) {
        toast.error("Session expired. Please login again.");
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          errorData.detail ||
            errorData.message ||
            "Failed to update profile"
        );
      }

      const updatedData = await response.json();

      console.log("UPDATED PROFILE DATA:", updatedData);

      // ========================================================
      // USE THE ACTUAL BACKEND RESPONSE
      // ========================================================

      if (updatedData.name !== undefined) {
        setName(updatedData.name);
        localStorage.setItem("userName", updatedData.name);
      }

      if (updatedData.email !== undefined) {
        setEmail(updatedData.email);
        localStorage.setItem("userEmail", updatedData.email);
        localStorage.setItem("email", updatedData.email);
      }

      if (updatedData.phone !== undefined) {
        setPhone(updatedData.phone ?? "");
      }

      if (updatedData.department !== undefined) {
        setDepartment(updatedData.department ?? "");
      }

      if (updatedData.year !== undefined) {
        setYear(updatedData.year ?? "");
      }

      if (updatedData.profile_image !== undefined) {
        setProfileImage(updatedData.profile_image ?? "");
      }

      if (updatedData.notifications !== undefined) {
        setNotifications(updatedData.notifications);
      }

      if (updatedData.theme !== undefined) {
        setTheme(updatedData.theme);
      }

      localStorage.setItem("theme", theme);

      setImageFile(null);

      toast.success(
        updatedData.message || "Profile updated successfully"
      );
    } catch (error) {
      console.error("Profile update error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("expires_in");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("email");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");

    toast.success("Logged Out Successfully");

    router.replace("/login");
  };

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);

    setProfileImage(previewUrl);
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        <h1 className="text-3xl font-bold text-orange-500">
          Loading Profile...
        </h1>
      </main>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white">
        {/* ======================================================
            PROFILE HEADER
        ====================================================== */}

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-80 rounded-b-[50px] relative flex flex-col items-center justify-center">
          <div className="relative">
            {profileImage ? (
              <img
                src={
                  profileImage.startsWith("http")
                    ? profileImage
                    : `${API_URL}${profileImage}`
                }
                alt="Profile"
                className="w-40 h-40 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-40 h-40 rounded-full border-4 border-white bg-zinc-800 flex items-center justify-center text-5xl font-bold">
                {name
                  ? name.charAt(0).toUpperCase()
                  : "U"}
              </div>
            )}

            <label className="absolute bottom-0 right-0 bg-black p-3 rounded-full cursor-pointer hover:bg-zinc-800">
              <Camera size={20} />

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </label>
          </div>

          <h1 className="text-4xl font-bold mt-5">
            {name || "User"}
          </h1>

          <p className="text-white/80 mt-2 text-lg">
            {email}
          </p>
        </div>

        <div className="max-w-6xl mx-auto p-6 md:p-10">
          {/* ====================================================
              ACCOUNT INFORMATION
          ==================================================== */}

          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
            <h2 className="text-3xl font-bold mb-8">
              Account Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="bg-zinc-800 p-4 rounded-2xl outline-none border border-transparent focus:border-orange-500"
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                className="bg-zinc-800 p-4 rounded-2xl outline-none border border-transparent focus:border-orange-500"
              />

              <input
                type="text"
                placeholder="Department"
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
                className="bg-zinc-800 p-4 rounded-2xl outline-none border border-transparent focus:border-orange-500"
              />

              <select
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
                className="bg-zinc-800 p-4 rounded-2xl outline-none border border-transparent focus:border-orange-500"
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
          </div>

          {/* ====================================================
              LIVE STATS
          ==================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
            {/* ORDERS */}

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
              <ShoppingBag
                className="text-orange-500"
                size={35}
              />

              <h3 className="text-4xl font-bold mt-5">
                {totalOrders}
              </h3>

              <p className="text-gray-400 mt-2">
                Orders
              </p>
            </div>

            {/* WALLET */}

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
              <Wallet
                className="text-green-400"
                size={35}
              />

              <h3 className="text-4xl font-bold mt-5">
                ₹{wallet.toLocaleString("en-IN")}
              </h3>

              <p className="text-gray-400 mt-2">
                Wallet
              </p>
            </div>

            {/* FAVORITES */}

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
              <Heart
                className="text-red-400"
                size={35}
              />

              <h3 className="text-4xl font-bold mt-5">
                {favorites}
              </h3>

              <p className="text-gray-400 mt-2">
                Favorites
              </p>
            </div>

            {/* TOTAL SPENT */}

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
              <Wallet
                className="text-blue-400"
                size={35}
              />

              <h3 className="text-4xl font-bold mt-5">
                ₹{totalSpent.toLocaleString("en-IN")}
              </h3>

              <p className="text-gray-400 mt-2">
                Total Spent
              </p>
            </div>
          </div>

          {/* ====================================================
              SETTINGS
          ==================================================== */}

          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 mt-10">
            <h2 className="text-3xl font-bold mb-8">
              Settings
            </h2>

            <div className="flex flex-col gap-8">
              {/* NOTIFICATIONS */}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Bell />

                  <p className="text-xl">
                    Notifications
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) =>
                    setNotifications(
                      e.target.checked
                    )
                  }
                  className="w-6 h-6"
                />
              </div>

              {/* DARK THEME */}

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Moon />

                  <p className="text-xl">
                    Dark Theme
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={theme === "dark"}
                  onChange={(e) =>
                    setTheme(
                      e.target.checked
                        ? "dark"
                        : "light"
                    )
                  }
                  className="w-6 h-6"
                />
              </div>
            </div>
          </div>

          {/* ====================================================
              ACTION BUTTONS
          ==================================================== */}

          <div className="flex flex-col md:flex-row gap-6 mt-10">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 transition-all py-5 rounded-3xl text-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Save />

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 bg-red-500 hover:bg-red-600 transition-all py-5 rounded-3xl text-2xl font-bold flex items-center justify-center gap-3"
            >
              <LogOut />

              Logout
            </button>
          </div>
        </div>
      </main>
    </>
  );
}