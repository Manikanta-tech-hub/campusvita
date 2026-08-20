"use client";

import toast from "react-hot-toast";

import {
  Camera,
  CheckCircle2,
  ShoppingBag,
  User,
  Wallet,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import Navbar from "@/components/layout/Navbar";

const API_URL = "http://127.0.0.1:8000";

/* ============================================================
   TYPES
============================================================ */

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  profile_image: string;
  wallet: number;
  total_orders: number;
  total_spent: number;
};

/* ============================================================
   EMPTY PROFILE
============================================================ */

const EMPTY_PROFILE: ProfileData = {
  name: "",
  email: "",
  phone: "",
  department: "",
  year: "",
  profile_image: "",
  wallet: 0,
  total_orders: 0,
  total_spent: 0,
};

/* ============================================================
   API ERROR HANDLER
   Prevents:
   [object Object],[object Object]
============================================================ */

function getApiErrorMessage(
  errorData: unknown,
  fallback: string
): string {
  if (!errorData) {
    return fallback;
  }

  // Simple string
  if (typeof errorData === "string") {
    return errorData;
  }

  // Array response
  if (Array.isArray(errorData)) {
    const messages = errorData
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (
          typeof item === "object" &&
          item !== null
        ) {
          const objectItem =
            item as Record<string, unknown>;

          if (
            typeof objectItem.msg === "string"
          ) {
            return objectItem.msg;
          }

          if (
            typeof objectItem.message === "string"
          ) {
            return objectItem.message;
          }

          if (
            typeof objectItem.detail === "string"
          ) {
            return objectItem.detail;
          }

          try {
            return JSON.stringify(item);
          } catch {
            return "";
          }
        }

        return String(item);
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }

    return fallback;
  }

  // Object response
  if (
    typeof errorData === "object" &&
    errorData !== null
  ) {
    const objectData =
      errorData as Record<string, unknown>;

    if (
      typeof objectData.detail === "string"
    ) {
      return objectData.detail;
    }

    if (
      Array.isArray(objectData.detail)
    ) {
      return getApiErrorMessage(
        objectData.detail,
        fallback
      );
    }

    if (
      typeof objectData.message === "string"
    ) {
      return objectData.message;
    }

    if (
      typeof objectData.error === "string"
    ) {
      return objectData.error;
    }

    try {
      return JSON.stringify(objectData);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

/* ============================================================
   PROFILE PAGE
============================================================ */

export default function ProfilePage() {
  const router = useRouter();

  /* ==========================================================
     STATE
  ========================================================== */

  const [loading, setLoading] = useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [profile, setProfile] =
    useState<ProfileData>(EMPTY_PROFILE);

  const [imagePreview, setImagePreview] =
    useState("");

  /*
   * Keeps track of the latest saved profile.
   * This prevents unnecessary duplicate PUT requests.
   */
  const lastSavedProfile = useRef({
    name: "",
    phone: "",
    department: "",
    year: "",
  });

  /* ============================================================
     AUTH CLEANUP
  ============================================================ */

  const clearAuth = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("expires_in");

    localStorage.removeItem("isLoggedIn");

    localStorage.removeItem("userEmail");
    localStorage.removeItem("email");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
  }, []);

  /* ============================================================
     RESOLVE IMAGE URL
  ============================================================ */

  const resolveImageUrl = useCallback(
    (image: string) => {
      if (!image) {
        return "";
      }

      if (image.startsWith("blob:")) {
        return image;
      }

      if (
        image.startsWith("http://") ||
        image.startsWith("https://")
      ) {
        return image;
      }

      if (image.startsWith("/")) {
        return `${API_URL}${image}`;
      }

      return `${API_URL}/${image}`;
    },
    []
  );

  /* ============================================================
     LOAD LIVE PROFILE
  ============================================================ */

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/profile`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },

            cache: "no-store",
          }
        );

        /* ------------------------------------------------------
           AUTH ERROR
        ------------------------------------------------------ */

        if (response.status === 401) {
          clearAuth();

          toast.error(
            "Session expired. Please login again."
          );

          router.replace("/login");
          return;
        }

        /* ------------------------------------------------------
           OTHER ERROR
        ------------------------------------------------------ */

        if (!response.ok) {
          const errorData =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            getApiErrorMessage(
              errorData,
              "Failed to load profile"
            )
          );
        }

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        console.log(
          "========== LIVE USER PROFILE =========="
        );

        console.log(data);

        console.log(
          "========================================"
        );

        /* ------------------------------------------------------
           PROFILE
        ------------------------------------------------------ */

        const liveProfile: ProfileData = {
          name: data.name ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          department:
            data.department ?? "",
          year: data.year ?? "",

          profile_image:
            typeof data.profile_image ===
            "string"
              ? data.profile_image.trim()
              : "",

          wallet: Number(
            data.wallet ?? 0
          ),

          total_orders: Number(
            data.total_orders ?? 0
          ),

          total_spent: Number(
            data.total_spent ?? 0
          ),
        };

        setProfile(liveProfile);

        setImagePreview("");

        /* ------------------------------------------------------
           REMEMBER LAST SAVED PROFILE
        ------------------------------------------------------ */

        lastSavedProfile.current = {
          name: liveProfile.name,
          phone: liveProfile.phone,
          department:
            liveProfile.department,
          year: liveProfile.year,
        };

        /* ------------------------------------------------------
           KEEP LOGIN DATA IN SYNC
        ------------------------------------------------------ */

        if (liveProfile.email) {
          localStorage.setItem(
            "userEmail",
            liveProfile.email
          );

          localStorage.setItem(
            "email",
            liveProfile.email
          );
        }

        if (liveProfile.name) {
          localStorage.setItem(
            "userName",
            liveProfile.name
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
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router, clearAuth]);

  /* ============================================================
     UPDATE PROFILE
     AUTO-SAVES ON BLUR
  ============================================================ */

  const updateProfile = async () => {
    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    const currentValues = {
      name: profile.name.trim(),
      phone: profile.phone.trim(),
      department:
        profile.department.trim(),
      year: profile.year,
    };

    /* ----------------------------------------------------------
       DON'T SEND DUPLICATE REQUEST
    ---------------------------------------------------------- */

    const lastSaved =
      lastSavedProfile.current;

    const hasChanges =
      currentValues.name !==
        lastSaved.name ||
      currentValues.phone !==
        lastSaved.phone ||
      currentValues.department !==
        lastSaved.department ||
      currentValues.year !==
        lastSaved.year;

    if (!hasChanges) {
      return;
    }

    /* ----------------------------------------------------------
       BASIC VALIDATION
    ---------------------------------------------------------- */

    if (!currentValues.name) {
      toast.error("Name is required.");
      return;
    }

    if (currentValues.phone) {
      if (
        !/^\d{10}$/.test(
          currentValues.phone
        )
      ) {
        toast.error(
          "Phone number must be exactly 10 digits."
        );

        return;
      }

      if (
        !/^[6789]/.test(
          currentValues.phone
        )
      ) {
        toast.error(
          "Please enter a valid Indian mobile number."
        );

        return;
      }
    }

    try {
      setSavingProfile(true);

      const response = await fetch(
        `${API_URL}/profile`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: currentValues.name,
            phone: currentValues.phone,
            department:
              currentValues.department,
            year: currentValues.year,
            profile_image:
              profile.profile_image,
          }),
        }
      );

      /* --------------------------------------------------------
         AUTH ERROR
      -------------------------------------------------------- */

      if (response.status === 401) {
        clearAuth();

        toast.error(
          "Session expired. Please login again."
        );

        router.replace("/login");
        return;
      }

      /* --------------------------------------------------------
         API ERROR
      -------------------------------------------------------- */

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          getApiErrorMessage(
            errorData,
            "Failed to update profile"
          )
        );
      }

      const updatedData =
        await response.json();

      console.log(
        "========== PROFILE UPDATED =========="
      );

      console.log(updatedData);

      console.log(
        "====================================="
      );

      /* --------------------------------------------------------
         UPDATE LOCAL STATE
      -------------------------------------------------------- */

      setProfile((current) => ({
        ...current,

        name:
          updatedData.name ??
          current.name,

        email:
          updatedData.email ??
          current.email,

        phone:
          updatedData.phone ??
          current.phone,

        department:
          updatedData.department ??
          current.department,

        year:
          updatedData.year ??
          current.year,

        profile_image:
          updatedData.profile_image ??
          current.profile_image,
      }));

      /* --------------------------------------------------------
         UPDATE LAST SAVED VALUES
      -------------------------------------------------------- */

      lastSavedProfile.current = {
        name:
          updatedData.name ??
          currentValues.name,

        phone:
          updatedData.phone ??
          currentValues.phone,

        department:
          updatedData.department ??
          currentValues.department,

        year:
          updatedData.year ??
          currentValues.year,
      };

      /* --------------------------------------------------------
         SYNC LOCAL STORAGE
      -------------------------------------------------------- */

      const savedName =
        updatedData.name ??
        currentValues.name;

      const savedEmail =
        updatedData.email ??
        profile.email;

      if (savedName) {
        localStorage.setItem(
          "userName",
          savedName
        );
      }

      if (savedEmail) {
        localStorage.setItem(
          "userEmail",
          savedEmail
        );

        localStorage.setItem(
          "email",
          savedEmail
        );
      }

      toast.success(
        "Profile updated successfully."
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
      setSavingProfile(false);
    }
  };

  /* ============================================================
     PROFILE IMAGE UPLOAD
  ============================================================ */

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    /* ----------------------------------------------------------
       VALIDATE FILE TYPE
    ---------------------------------------------------------- */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      toast.error(
        "Only JPG, PNG and WEBP images are allowed."
      );

      return;
    }

    /* ----------------------------------------------------------
       VALIDATE FILE SIZE
    ---------------------------------------------------------- */

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      toast.error(
        "Image must be smaller than 5 MB."
      );

      return;
    }

    /* ----------------------------------------------------------
       AUTH
    ---------------------------------------------------------- */

    const token =
      localStorage.getItem(
        "access_token"
      );

    if (!token) {
      router.replace("/login");
      return;
    }

    const temporaryPreview =
      URL.createObjectURL(file);

    setImagePreview(
      temporaryPreview
    );

    try {
      setUploadingImage(true);

      /* --------------------------------------------------------
         UPLOAD IMAGE
      -------------------------------------------------------- */

      const formData =
        new FormData();

      formData.append(
        "file",
        file
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

            body: formData,
          }
        );

      const uploadData =
        await uploadResponse
          .json()
          .catch(() => null);

      /* --------------------------------------------------------
         AUTH ERROR
      -------------------------------------------------------- */

      if (
        uploadResponse.status ===
        401
      ) {
        clearAuth();

        toast.error(
          "Session expired. Please login again."
        );

        router.replace("/login");
        return;
      }

      /* --------------------------------------------------------
         UPLOAD ERROR
      -------------------------------------------------------- */

      if (!uploadResponse.ok) {
        throw new Error(
          getApiErrorMessage(
            uploadData,
            "Profile image upload failed"
          )
        );
      }

      /* --------------------------------------------------------
         GET PERMANENT IMAGE
      -------------------------------------------------------- */

      const uploadedImage =
        uploadData?.profile_image ||
        uploadData?.image_url ||
        "";

      if (
        typeof uploadedImage !==
          "string" ||
        !uploadedImage.trim()
      ) {
        throw new Error(
          "Backend did not return the saved profile image."
        );
      }

      if (
        uploadedImage.startsWith(
          "blob:"
        )
      ) {
        throw new Error(
          "Backend returned an invalid temporary image URL."
        );
      }

      const permanentImage =
        uploadedImage.trim();

      /* --------------------------------------------------------
         UPDATE PROFILE IMAGE IN DATABASE
      -------------------------------------------------------- */

      const profileResponse =
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
              name: profile.name.trim(),

              phone:
                profile.phone.trim(),

              department:
                profile.department.trim(),

              year: profile.year,

              profile_image:
                permanentImage,
            }),
          }
        );

      /* --------------------------------------------------------
         AUTH ERROR
      -------------------------------------------------------- */

      if (
        profileResponse.status ===
        401
      ) {
        clearAuth();

        toast.error(
          "Session expired. Please login again."
        );

        router.replace("/login");
        return;
      }

      /* --------------------------------------------------------
         PROFILE SAVE ERROR
      -------------------------------------------------------- */

      if (!profileResponse.ok) {
        const errorData =
          await profileResponse
            .json()
            .catch(() => null);

        throw new Error(
          getApiErrorMessage(
            errorData,
            "Failed to save profile image"
          )
        );
      }

      const savedProfile =
        await profileResponse
          .json()
          .catch(() => null);

      /* --------------------------------------------------------
         UPDATE LOCAL IMAGE
      -------------------------------------------------------- */

      setProfile((current) => ({
        ...current,

        profile_image:
          savedProfile?.profile_image ??
          permanentImage,
      }));

      setImagePreview("");

      URL.revokeObjectURL(
        temporaryPreview
      );

      toast.success(
        "Profile image updated successfully."
      );
    } catch (error) {
      URL.revokeObjectURL(
        temporaryPreview
      );

      setImagePreview("");

      console.error(
        "Profile image error:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile image"
      );
    } finally {
      setUploadingImage(false);
    }
  };

  /* ============================================================
     DISPLAY IMAGE
  ============================================================ */

  const displayImage = useMemo(() => {
    if (imagePreview) {
      return imagePreview;
    }

    return resolveImageUrl(
      profile.profile_image
    );
  }, [
    imagePreview,
    profile.profile_image,
    resolveImageUrl,
  ]);

  /* ============================================================
     LOADING SCREEN
  ============================================================ */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-800 border-t-orange-500" />

          <h1 className="text-xl font-semibold">
            Loading Profile...
          </h1>
        </div>
      </main>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white">
        {/* =====================================================
            PROFILE HERO
        ===================================================== */}

        <section className="relative flex min-h-[320px] flex-col items-center justify-center rounded-b-[45px] bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-10">
          {/* PROFILE IMAGE */}

          <div className="relative">
            {displayImage ? (
              <img
                src={displayImage}
                alt="Profile"
                className="h-36 w-36 rounded-full border-4 border-white object-cover shadow-2xl sm:h-40 sm:w-40"
                onError={(event) => {
                  console.error(
                    "Failed to load profile image:",
                    displayImage
                  );

                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-white bg-zinc-800 text-5xl font-bold shadow-2xl sm:h-40 sm:w-40">
                {profile.name
                  ? profile.name
                      .charAt(0)
                      .toUpperCase()
                  : "U"}
              </div>
            )}

            {/* CAMERA */}

            <label className="absolute bottom-0 right-0 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:bg-zinc-800">
              <Camera size={20} />

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={
                  handleImageChange
                }
                disabled={
                  uploadingImage
                }
              />
            </label>
          </div>

          {/* NAME */}

          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
            {profile.name || "User"}
          </h1>

          {/* EMAIL */}

          <p className="mt-2 text-base text-white/80 sm:text-lg">
            {profile.email}
          </p>

          {/* IMAGE STATUS */}

          {uploadingImage ? (
            <p className="mt-3 rounded-full bg-black/20 px-4 py-1.5 text-sm text-white">
              Updating profile image...
            </p>
          ) : null}
        </section>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <div className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
          {/* ===================================================
              ACCOUNT INFORMATION
          =================================================== */}

          <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl md:p-8">
            {/* HEADER */}

            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  Account Information
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  Your profile information is
                  saved automatically.
                </p>
              </div>

              {/* SAVE STATUS */}

              <div className="flex items-center gap-2 text-sm">
                {savingProfile ? (
                  <>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />

                    <span className="text-orange-400">
                      Saving...
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2
                      size={16}
                      className="text-emerald-400"
                    />

                    <span className="text-emerald-400">
                      Saved
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* FORM */}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* NAME */}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-400">
                  Full Name
                </span>

                <input
                  type="text"
                  placeholder="Full Name"
                  value={profile.name}
                  onChange={(event) =>
                    setProfile(
                      (current) => ({
                        ...current,
                        name: event.target.value,
                      })
                    )
                  }
                  onBlur={
                    updateProfile
                  }
                  className="w-full rounded-2xl border border-transparent bg-zinc-800 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:bg-zinc-800"
                />
              </label>

              {/* PHONE */}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-400">
                  Phone Number
                </span>

                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="Phone Number"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile(
                      (current) => ({
                        ...current,
                        phone: event.target.value.replace(
                          /\D/g,
                          ""
                        ),
                      })
                    )
                  }
                  onBlur={
                    updateProfile
                  }
                  maxLength={10}
                  className="w-full rounded-2xl border border-transparent bg-zinc-800 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:bg-zinc-800"
                />
              </label>

              {/* DEPARTMENT */}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-400">
                  Department
                </span>

                <input
                  type="text"
                  placeholder="Department"
                  value={
                    profile.department
                  }
                  onChange={(event) =>
                    setProfile(
                      (current) => ({
                        ...current,
                        department:
                          event.target.value,
                      })
                    )
                  }
                  onBlur={
                    updateProfile
                  }
                  className="w-full rounded-2xl border border-transparent bg-zinc-800 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:bg-zinc-800"
                />
              </label>

              {/* YEAR */}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-400">
                  Academic Year
                </span>

                <select
                  value={profile.year}
                  onChange={(event) =>
                    setProfile(
                      (current) => ({
                        ...current,
                        year: event.target.value,
                      })
                    )
                  }
                  onBlur={
                    updateProfile
                  }
                  className="w-full rounded-2xl border border-transparent bg-zinc-800 px-4 py-4 text-white outline-none transition focus:border-orange-500"
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
              </label>
            </div>
          </section>

          {/* ===================================================
              LIVE ACCOUNT STATISTICS
          =================================================== */}

          <section className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* ORDERS */}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10">
                <ShoppingBag
                  className="text-orange-500"
                  size={26}
                />
              </div>

              <h3 className="mt-5 text-4xl font-bold">
                {profile.total_orders}
              </h3>

              <p className="mt-2 text-gray-400">
                Total Orders
              </p>
            </div>

            {/* WALLET */}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
                <Wallet
                  className="text-green-400"
                  size={26}
                />
              </div>

              <h3 className="mt-5 text-4xl font-bold">
                ₹
                {profile.wallet.toLocaleString(
                  "en-IN"
                )}
              </h3>

              <p className="mt-2 text-gray-400">
                Wallet Balance
              </p>
            </div>

            {/* TOTAL SPENT */}

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl transition hover:border-zinc-700">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                <Wallet
                  className="text-blue-400"
                  size={26}
                />
              </div>

              <h3 className="mt-5 text-4xl font-bold">
                ₹
                {profile.total_spent.toLocaleString(
                  "en-IN"
                )}
              </h3>

              <p className="mt-2 text-gray-400">
                Total Spent
              </p>
            </div>
          </section>

          {/* ===================================================
              PROFILE INFORMATION
          =================================================== */}

          <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                <User size={20} />
              </div>

              <div>
                <h3 className="font-semibold text-white">
                  Profile information
                </h3>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Your account information and
                  profile image are connected to
                  your authenticated account.
                  Changes are saved automatically
                  through the existing backend.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}