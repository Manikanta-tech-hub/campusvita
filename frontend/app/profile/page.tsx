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

  // ============================================================
  // IMPORTANT
  //
  // profileImage = permanent image path/URL from backend/database
  //
  // imagePreview = temporary blob URL used ONLY before upload
  // ============================================================

  const [profileImage, setProfileImage] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("dark");

  const [wallet, setWallet] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [favorites, setFavorites] = useState(0);

  // ============================================================
  // RESOLVE PROFILE IMAGE URL
  // ============================================================

  const resolveImageUrl = (image: string) => {
    if (!image) {
      return "";
    }

    // ----------------------------------------------------------
    // Temporary blob URL
    // This should only be used for local preview.
    // It is NEVER stored in MongoDB.
    // ----------------------------------------------------------

    if (image.startsWith("blob:")) {
      return image;
    }

    // ----------------------------------------------------------
    // Already a complete URL
    // Example:
    // https://res.cloudinary.com/...
    // http://...
    // ----------------------------------------------------------

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    // ----------------------------------------------------------
    // Backend relative path
    //
    // Example:
    // /uploads/profile/abc123.jpg
    //
    // becomes:
    // http://127.0.0.1:8000/uploads/profile/abc123.jpg
    // ----------------------------------------------------------

    if (image.startsWith("/")) {
      return `${API_URL}${image}`;
    }

    // ----------------------------------------------------------
    // Path without leading slash
    // ----------------------------------------------------------

    return `${API_URL}/${image}`;
  };

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    let cancelled = false;

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
          },
          cache: "no-store",
        });

        // ------------------------------------------------------
        // AUTH ERROR
        // ------------------------------------------------------

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

        // ------------------------------------------------------
        // OTHER API ERROR
        // ------------------------------------------------------

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({}));

          throw new Error(
            errorData.detail ||
              errorData.message ||
              "Failed to load profile"
          );
        }

        const data = await response.json();

        console.log("========== LIVE PROFILE ==========");
        console.log(data);
        console.log("PROFILE IMAGE FROM DATABASE:", data.profile_image);
        console.log("==================================");

        if (cancelled) {
          return;
        }

        // ------------------------------------------------------
        // PROFILE INFORMATION
        // ------------------------------------------------------

        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setPhone(data.phone ?? "");
        setDepartment(data.department ?? "");
        setYear(data.year ?? "");

        // ------------------------------------------------------
        // CRITICAL:
        //
        // This value MUST come from MongoDB through GET /profile.
        //
        // We do NOT use localStorage for the profile image.
        // We do NOT use a blob URL here.
        // ------------------------------------------------------

        const savedProfileImage =
          typeof data.profile_image === "string"
            ? data.profile_image.trim()
            : "";

        if (savedProfileImage) {
          // Make sure a bad old blob URL isn't persisted.
          if (!savedProfileImage.startsWith("blob:")) {
            setProfileImage(savedProfileImage);
          } else {
            console.warn(
              "Ignoring invalid persisted blob profile image."
            );
            setProfileImage("");
          }
        } else {
          setProfileImage("");
        }

        // No temporary preview after loading from backend.
        setImagePreview("");

        // ------------------------------------------------------
        // SETTINGS
        // ------------------------------------------------------

        setNotifications(
          data.notifications ?? true
        );

        setTheme(
          data.theme ?? "dark"
        );

        // ------------------------------------------------------
        // STATS
        // ------------------------------------------------------

        setWallet(
          Number(data.wallet ?? 0)
        );

        setTotalOrders(
          Number(data.total_orders ?? 0)
        );

        setTotalSpent(
          Number(data.total_spent ?? 0)
        );

        // ------------------------------------------------------
        // FAVORITES
        // ------------------------------------------------------

        if (
          typeof data.favorites_count === "number"
        ) {
          setFavorites(
            data.favorites_count
          );
        } else if (
          Array.isArray(data.favorite_foods)
        ) {
          setFavorites(
            data.favorite_foods.length
          );
        } else {
          setFavorites(0);
        }

        // ------------------------------------------------------
        // SYNCHRONIZE LOGIN INFORMATION
        // ------------------------------------------------------

        if (data.email) {
          localStorage.setItem(
            "userEmail",
            data.email
          );

          localStorage.setItem(
            "email",
            data.email
          );
        }

        if (data.name) {
          localStorage.setItem(
            "userName",
            data.name
          );
        }

      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Profile loading error:",
          error
        );

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load profile"
        );

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ============================================================
  // IMAGE SELECTION
  // ============================================================

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // ----------------------------------------------------------
    // VALIDATE IMAGE TYPE
    // ----------------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Only JPG, PNG and WEBP images are allowed"
      );

      event.target.value = "";
      return;
    }

    // ----------------------------------------------------------
    // VALIDATE IMAGE SIZE
    // ----------------------------------------------------------

    if (file.size > 5 * 1024 * 1024) {
      toast.error(
        "Image must be smaller than 5 MB"
      );

      event.target.value = "";
      return;
    }

    // ----------------------------------------------------------
    // CLEAN OLD PREVIEW URL
    // ----------------------------------------------------------

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    // ----------------------------------------------------------
    // STORE FILE
    // ----------------------------------------------------------

    setImageFile(file);

    // ----------------------------------------------------------
    // CREATE TEMPORARY PREVIEW
    //
    // IMPORTANT:
    //
    // This URL is ONLY for displaying the selected image
    // before it is uploaded.
    //
    // It is NOT saved to MongoDB.
    // ----------------------------------------------------------

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);

    console.log(
      "Selected image for upload:",
      file.name
    );

    // Allow selecting the same file again later.
    event.target.value = "";
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSaveProfile = async () => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      toast.error("Please login again.");
      router.replace("/login");
      return;
    }

    try {
      setSaving(true);

      // --------------------------------------------------------
      // Start with the EXISTING permanent database image.
      //
      // Do NOT use imagePreview here.
      // --------------------------------------------------------

      let savedImageUrl = profileImage;

      // ========================================================
      // STEP 1 — UPLOAD NEW IMAGE
      // ========================================================

      if (imageFile) {
        const formData = new FormData();

        formData.append(
          "file",
          imageFile
        );

        console.log(
          "Uploading profile image..."
        );

        const uploadResponse =
          await fetch(
            `${API_URL}/profile/upload-image`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },

              // IMPORTANT:
              // Do NOT manually set Content-Type.
              // Browser sets multipart/form-data boundary.
              body: formData,
            }
          );

        const uploadData =
          await uploadResponse
            .json()
            .catch(() => ({}));

        console.log(
          "========== IMAGE UPLOAD RESPONSE =========="
        );
        console.log(uploadData);
        console.log(
          "============================================"
        );

        // ------------------------------------------------------
        // AUTH ERROR
        // ------------------------------------------------------

        if (uploadResponse.status === 401) {
          toast.error(
            "Session expired. Please login again."
          );

          router.replace("/login");
          return;
        }

        // ------------------------------------------------------
        // UPLOAD ERROR
        // ------------------------------------------------------

        if (!uploadResponse.ok) {
          throw new Error(
            uploadData.detail ||
              uploadData.message ||
              "Profile image upload failed"
          );
        }

        // ------------------------------------------------------
        // GET PERMANENT IMAGE PATH FROM BACKEND
        //
        // Your backend may return either:
        //
        // profile_image
        //
        // OR
        //
        // image_url
        // ------------------------------------------------------

        const uploadedImage =
          uploadData.profile_image ||
          uploadData.image_url ||
          "";

        if (
          typeof uploadedImage !== "string" ||
          !uploadedImage.trim()
        ) {
          throw new Error(
            "Backend did not return the saved profile image path"
          );
        }

        // ------------------------------------------------------
        // NEVER ACCEPT BLOB URL FROM BACKEND
        // ------------------------------------------------------

        if (
          uploadedImage.startsWith("blob:")
        ) {
          throw new Error(
            "Backend returned an invalid temporary blob URL"
          );
        }

        // ------------------------------------------------------
        // THIS IS NOW THE PERMANENT IMAGE PATH
        // ------------------------------------------------------

        savedImageUrl =
          uploadedImage.trim();

        console.log(
          "PERMANENT IMAGE PATH:",
          savedImageUrl
        );

        // ------------------------------------------------------
        // Immediately display permanent backend image.
        // ------------------------------------------------------

        setProfileImage(
          savedImageUrl
        );

        // ------------------------------------------------------
        // Remove temporary preview.
        // ------------------------------------------------------

        if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
        }

        setImagePreview("");
        setImageFile(null);
      }

      // ========================================================
      // STEP 2 — UPDATE PROFILE
      // ========================================================

      const response =
        await fetch(
          `${API_URL}/profile`,
          {
            method: "PUT",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: name.trim(),
              phone: phone.trim(),
              department:
                department.trim(),
              year,
              profile_image:
                savedImageUrl,
              notifications,
              theme,
            }),
          }
        );

      // --------------------------------------------------------
      // AUTH ERROR
      // --------------------------------------------------------

      if (response.status === 401) {
        toast.error(
          "Session expired. Please login again."
        );

        router.replace("/login");
        return;
      }

      // --------------------------------------------------------
      // PROFILE UPDATE ERROR
      // --------------------------------------------------------

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => ({}));

        throw new Error(
          errorData.detail ||
            errorData.message ||
            "Failed to update profile"
        );
      }

      const updatedData =
        await response.json();

      console.log(
        "========== UPDATED PROFILE =========="
      );
      console.log(updatedData);
      console.log(
        "======================================"
      );

      // ========================================================
      // IMPORTANT:
      //
      // Your current PUT /profile backend may only return:
      //
      // {
      //   "message": "Profile Updated Successfully 🚀"
      // }
      //
      // Therefore DON'T depend on updatedData.profile_image.
      //
      // We already have the permanent image path from the upload
      // endpoint.
      // ========================================================

      setProfileImage(
        savedImageUrl
      );

      // --------------------------------------------------------
      // UPDATE LOCAL STATE
      // --------------------------------------------------------

      if (
        updatedData.name !== undefined
      ) {
        setName(
          updatedData.name
        );

        localStorage.setItem(
          "userName",
          updatedData.name
        );
      }

      if (
        updatedData.email !== undefined
      ) {
        setEmail(
          updatedData.email
        );

        localStorage.setItem(
          "userEmail",
          updatedData.email
        );

        localStorage.setItem(
          "email",
          updatedData.email
        );
      }

      if (
        updatedData.phone !== undefined
      ) {
        setPhone(
          updatedData.phone ?? ""
        );
      }

      if (
        updatedData.department !== undefined
      ) {
        setDepartment(
          updatedData.department ?? ""
        );
      }

      if (
        updatedData.year !== undefined
      ) {
        setYear(
          updatedData.year ?? ""
        );
      }

      if (
        updatedData.notifications !== undefined
      ) {
        setNotifications(
          updatedData.notifications
        );
      }

      if (
        updatedData.theme !== undefined
      ) {
        setTheme(
          updatedData.theme
        );
      }

      // --------------------------------------------------------
      // Clear selected image file
      // --------------------------------------------------------

      setImageFile(null);

      // --------------------------------------------------------
      // Save theme preference
      // --------------------------------------------------------

      localStorage.setItem(
        "theme",
        theme
      );

      toast.success(
        updatedData.message ||
          "Profile updated successfully"
      );

    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

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
    // ----------------------------------------------------------
    // IMPORTANT:
    //
    // We intentionally DO NOT remove profileImage from MongoDB.
    //
    // Logout only removes authentication data from browser.
    // The image remains associated with the user's database record.
    // ----------------------------------------------------------

    localStorage.removeItem(
      "isLoggedIn"
    );

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "refresh_token"
    );

    localStorage.removeItem(
      "token_type"
    );

    localStorage.removeItem(
      "expires_in"
    );

    localStorage.removeItem(
      "userEmail"
    );

    localStorage.removeItem(
      "email"
    );

    localStorage.removeItem(
      "userName"
    );

    localStorage.removeItem(
      "userRole"
    );

    toast.success(
      "Logged Out Successfully"
    );

    router.replace("/login");
  };

  // ============================================================
  // CLEANUP TEMPORARY PREVIEW
  // ============================================================

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

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
  // WHICH IMAGE SHOULD BE DISPLAYED?
  //
  // imagePreview = newly selected image
  // profileImage = saved database image
  //
  // Preview takes priority only BEFORE Save.
  // ============================================================

  const displayImage =
    imagePreview ||
    resolveImageUrl(profileImage);

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

            {displayImage ? (

              <img
                src={displayImage}
                alt="Profile"
                className="w-40 h-40 rounded-full border-4 border-white object-cover"
                onError={(event) => {
                  console.error(
                    "Failed to load profile image:",
                    displayImage
                  );

                  // ------------------------------------------------
                  // IMPORTANT:
                  //
                  // Do NOT delete the database value here.
                  //
                  // A browser image error should not modify MongoDB.
                  // ------------------------------------------------

                  event.currentTarget.style.display =
                    "none";
                }}
              />

            ) : (

              <div className="w-40 h-40 rounded-full border-4 border-white bg-zinc-800 flex items-center justify-center text-5xl font-bold">

                {name
                  ? name
                      .charAt(0)
                      .toUpperCase()
                  : "U"}

              </div>

            )}

            <label className="absolute bottom-0 right-0 bg-black p-3 rounded-full cursor-pointer hover:bg-zinc-800 transition">

              <Camera size={20} />

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={
                  handleImageChange
                }
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
                  setName(
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-4 rounded-2xl outline-none border border-transparent focus:border-orange-500"
              />

              <input
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-4 rounded-2xl outline-none border border-transparent focus:border-orange-500"
              />

              <input
                type="text"
                placeholder="Department"
                value={department}
                onChange={(e) =>
                  setDepartment(
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-4 rounded-2xl outline-none border border-transparent focus:border-orange-500"
              />

              <select
                value={year}
                onChange={(e) =>
                  setYear(
                    e.target.value
                  )
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

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">

              <Wallet
                className="text-green-400"
                size={35}
              />

              <h3 className="text-4xl font-bold mt-5">
                ₹
                {wallet.toLocaleString(
                  "en-IN"
                )}
              </h3>

              <p className="text-gray-400 mt-2">
                Wallet
              </p>

            </div>

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

            <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800">

              <Wallet
                className="text-blue-400"
                size={35}
              />

              <h3 className="text-4xl font-bold mt-5">
                ₹
                {totalSpent.toLocaleString(
                  "en-IN"
                )}
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

              <div className="flex justify-between items-center">

                <div className="flex items-center gap-4">

                  <Moon />

                  <p className="text-xl">
                    Dark Theme
                  </p>

                </div>

                <input
                  type="checkbox"
                  checked={
                    theme === "dark"
                  }
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
              onClick={
                handleSaveProfile
              }
              disabled={saving}
              className="flex-1 bg-orange-500 hover:bg-orange-600 transition-all py-5 rounded-3xl text-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50"
            >

              <Save />

              {saving
                ? "Saving..."
                : "Save Changes"}

            </button>

            <button
              onClick={
                handleLogout
              }
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