"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { addFood } from "@/app/lib/api";
import { getAccessToken } from "@/app/lib/auth/session";

type Category = {
  id: string;
  name: string;
};

type Stall = {
  _id: string;
  name: string;
  is_open: boolean;
  active: boolean;
};

type AddFoodModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FoodType = "veg" | "non-veg" | "unknown";

type FoodForm = {
  name: string;
  description: string;
  category: string;
  category_id: string;
  stall_id: string;
  price: string;
  available: boolean;
  is_veg: FoodType;
};

const INITIAL_FORM: FoodForm = {
  name: "",
  description: "",
  category: "",
  category_id: "",
  stall_id: "",
  price: "",
  available: true,
  is_veg: "unknown",
};

export default function AddFoodModal({
  open,
  onClose,
  onSuccess,
}: AddFoodModalProps) {
  const [form, setForm] =
    useState<FoodForm>(INITIAL_FORM);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [stalls, setStalls] =
    useState<Stall[]>([]);

  const [categoryLoading, setCategoryLoading] =
    useState(false);

  const [stallLoading, setStallLoading] =
    useState(false);

  const [categoryError, setCategoryError] =
    useState("");

  const [stallError, setStallError] =
    useState("");

  const [categoryDropdownOpen, setCategoryDropdownOpen] =
    useState(false);

  const [categorySearch, setCategorySearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [loading, setLoading] =
    useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

  /*
   * ============================================================
   * FETCH STALLS
   * ============================================================
   */

  async function fetchStalls() {
    try {
      setStallLoading(true);
      setStallError("");

      const token = getAccessToken("ADMIN");

      if (!token) {
        setStallError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/admin/stalls?status_filter=ACTIVE`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: {
        stalls?: Stall[];
        detail?: string;
      } | null = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to fetch stalls"
        );
      }

      setStalls(data?.stalls ?? []);
    } catch (error) {
      console.error(
        "Stall loading error:",
        error
      );

      setStallError(
        error instanceof Error
          ? error.message
          : "Failed to load stalls."
      );
    } finally {
      setStallLoading(false);
    }
  }

  /*
   * ============================================================
   * FETCH CATEGORIES
   * ============================================================
   */

  async function fetchCategories() {
    try {
      setCategoryLoading(true);
      setCategoryError("");

      const token = getAccessToken("ADMIN");

      if (!token) {
        setCategoryError("Please login again.");
        return;
      }

      const response = await fetch(
        `${API_URL}/admin/categories?status_filter=ACTIVE&sort=NAME_ASC&page=1&limit=100`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: {
        categories?: Category[];
        detail?: string;
      } | null = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to fetch categories"
        );
      }

      setCategories(data?.categories ?? []);
    } catch (error) {
      console.error(
        "Category loading error:",
        error
      );

      setCategoryError(
        error instanceof Error
          ? error.message
          : "Failed to load categories."
      );
    } finally {
      setCategoryLoading(false);
    }
  }

  /*
   * ============================================================
   * LOAD STALLS + CATEGORIES WHEN MODAL OPENS
   * ============================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      if (cancelled) {
        return;
      }

      await Promise.all([
        fetchStalls(),
        fetchCategories(),
      ]);
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [open]);

  /*
   * ============================================================
   * IMAGE PREVIEW
   * ============================================================
   *
   * No imagePreview state is required.
   * The URL is derived directly from imageFile.
   */

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) {
      return "";
    }

    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    if (!imagePreviewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  /*
   * ============================================================
   * CATEGORY FILTER
   * ============================================================
   */

  const filteredCategories = useMemo(() => {
    const search =
      categorySearch.trim().toLowerCase();

    if (!search) {
      return categories;
    }

    return categories.filter(
      (category) =>
        category.name
          .toLowerCase()
          .includes(search)
    );
  }, [categories, categorySearch]);

  /*
   * ============================================================
   * FORM CHANGE
   * ============================================================
   */

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  /*
   * ============================================================
   * RESET FORM
   * ============================================================
   */

  function resetForm() {
    setForm(INITIAL_FORM);

    setSelectedCategory(null);
    setCategorySearch("");
    setCategoryDropdownOpen(false);

    setCategoryError("");
    setStallError("");

    setImageFile(null);
  }

  /*
   * ============================================================
   * CLOSE MODAL
   * ============================================================
   */

  function handleClose() {
    if (loading) {
      return;
    }

    resetForm();
    onClose();
  }

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  async function handleSubmit() {
    try {
      setLoading(true);

      const token = getAccessToken("ADMIN");

      if (!token) {
        alert("Please login again.");
        return;
      }

      if (!form.name.trim()) {
        alert("Food name is required.");
        return;
      }

      if (!form.description.trim()) {
        alert("Description is required.");
        return;
      }

      if (!selectedCategory) {
        alert("Please select a category.");
        return;
      }

      if (!form.stall_id) {
        alert("Please select a stall.");
        return;
      }

      if (
        !form.price ||
        Number(form.price) <= 0
      ) {
        alert("Enter a valid price.");
        return;
      }

      if (!imageFile) {
        alert("Please select an image.");
        return;
      }

      console.log(
        "FOOD TYPE BEFORE SUBMIT:",
        form.is_veg
      );

      console.log(
        "FULL FOOD FORM:",
        form
      );

      await addFood(
        {
          ...form,
          category: selectedCategory.name,
          category_id: selectedCategory.id,
          stall_id: form.stall_id,
        },
        imageFile,
        token
      );

      alert("Food added successfully!");

      resetForm();

      onSuccess();
      onClose();
    } catch (error) {
      console.error(
        "Add food error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to add food."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * MODAL
   * ============================================================
   */

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

        {/* Header */}
        <h2 className="mb-5 text-2xl font-bold text-black">
          Add Food
        </h2>

        {/* =====================================================
            FOOD NAME
        ====================================================== */}

        <input
          type="text"
          name="name"
          placeholder="Food Name"
          value={form.name}
          onChange={handleChange}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {/* =====================================================
            DESCRIPTION
        ====================================================== */}

        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {/* =====================================================
            FOOD TYPE
        ====================================================== */}

        <div className="mb-3">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Food Type
          </label>

          <div className="grid grid-cols-3 gap-2">

            {/* VEG */}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  is_veg: "veg",
                }))
              }
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                form.is_veg === "veg"
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              🟢 VEG
            </button>

            {/* NON-VEG */}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  is_veg: "non-veg",
                }))
              }
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                form.is_veg === "non-veg"
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              🔴 NON-VEG
            </button>

            {/* UNKNOWN */}
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  is_veg: "unknown",
                }))
              }
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                form.is_veg === "unknown"
                  ? "border-gray-500 bg-gray-100 text-gray-700"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Unknown
            </button>

          </div>
        </div>

        {/* =====================================================
            CATEGORY
        ====================================================== */}

        <div className="relative mb-3">

          <button
            type="button"
            onClick={() =>
              setCategoryDropdownOpen(
                (prev) => !prev
              )
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {selectedCategory ? (
              selectedCategory.name
            ) : (
              <span className="text-gray-400">
                Select Category
              </span>
            )}
          </button>

          {categoryDropdownOpen && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">

              {/* Search */}
              <div className="border-b border-gray-200 p-2">
                <input
                  type="text"
                  placeholder="Search category..."
                  value={categorySearch}
                  onChange={(e) =>
                    setCategorySearch(
                      e.target.value
                    )
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Loading */}
              {categoryLoading && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Loading categories...
                </div>
              )}

              {/* Error */}
              {!categoryLoading &&
                categoryError && (
                  <div className="px-4 py-3 text-sm text-red-500">
                    {categoryError}
                  </div>
                )}

              {/* Empty */}
              {!categoryLoading &&
                !categoryError &&
                filteredCategories.length ===
                  0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No categories found.
                  </div>
                )}

              {/* Categories */}
              {!categoryLoading &&
                !categoryError &&
                filteredCategories.length >
                  0 && (
                  <div className="max-h-52 overflow-y-auto">

                    {filteredCategories.map(
                      (category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(
                              category
                            );

                            setForm(
                              (prev) => ({
                                ...prev,
                                category:
                                  category.name,
                                category_id:
                                  category.id,
                              })
                            );

                            setCategoryDropdownOpen(
                              false
                            );

                            setCategorySearch(
                              ""
                            );
                          }}
                          className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                        >
                          {category.name}
                        </button>
                      )
                    )}

                  </div>
                )}

            </div>
          )}
        </div>

        {/* =====================================================
            STALL
        ====================================================== */}

        <div className="mb-3">

          <select
            name="stall_id"
            value={form.stall_id}
            onChange={handleChange}
            disabled={stallLoading}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">
              {stallLoading
                ? "Loading stalls..."
                : "Select Stall"}
            </option>

            {stalls.map((stall) => (
              <option
                key={stall._id}
                value={stall._id}
              >
                {stall.name}
                {!stall.is_open
                  ? " (Closed)"
                  : ""}
              </option>
            ))}

          </select>

          {stallError && (
            <p className="mt-1 text-sm text-red-500">
              {stallError}
            </p>
          )}

        </div>

        {/* =====================================================
            PRICE
        ====================================================== */}

        <input
          type="number"
          name="price"
          placeholder="Price"
          min="0"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {/* =====================================================
            IMAGE
        ====================================================== */}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file =
              e.target.files?.[0] ?? null;

            setImageFile(file);
          }}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
        />

        {/* =====================================================
            IMAGE PREVIEW
        ====================================================== */}

        {imageFile &&
          imagePreviewUrl && (
            <div className="mb-4">

              <img
                src={imagePreviewUrl}
                alt="Food preview"
                className="h-32 w-32 rounded-lg border object-cover"
              />

              <p className="mt-1 text-sm text-gray-500">
                {imageFile.name}
              </p>

            </div>
          )}

        {/* =====================================================
            AVAILABILITY
        ====================================================== */}

        <label className="mb-5 flex items-center gap-2 text-black">

          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                available:
                  e.target.checked,
              }))
            }
          />

          Available

        </label>

        {/* =====================================================
            BUTTONS
        ====================================================== */}

        <div className="flex justify-end gap-2">

          {/* CANCEL */}
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg bg-gray-300 px-4 py-2 text-black hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>

          {/* ADD FOOD */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading ||
              stallLoading ||
              categoryLoading
            }
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Adding..."
              : "Add Food"}
          </button>

        </div>

      </div>
    </div>
  );
}