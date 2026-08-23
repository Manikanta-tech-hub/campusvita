"use client";

import { useEffect, useState } from "react";
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

export default function AddFoodModal({
  open,
  onClose,
  onSuccess,
}: AddFoodModalProps) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    category_id: "",
    stall_id: "",
    price: "",
    available: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);

  const [categoryLoading, setCategoryLoading] = useState(false);
  const [stallLoading, setStallLoading] = useState(false);

  const [categoryError, setCategoryError] = useState("");
  const [stallError, setStallError] = useState("");

  const [categoryDropdownOpen, setCategoryDropdownOpen] =
    useState(false);

  const [categorySearch, setCategorySearch] = useState("");

  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);

  const [loading, setLoading] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000";

  useEffect(() => {
    if (!open) return;

    fetchStalls();
    fetchCategories();
  }, [open]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

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

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to fetch stalls"
        );
      }

      setStalls(data?.stalls || []);
    } catch (error) {
      console.error("Stall loading error:", error);
      setStallError("Failed to load stalls.");
    } finally {
      setStallLoading(false);
    }
  }

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

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail || "Failed to fetch categories"
        );
      }

      setCategories(data?.categories || []);
    } catch (error) {
      console.error(
        "Category loading error:",
        error
      );

      setCategoryError(
        "Failed to load categories."
      );
    } finally {
      setCategoryLoading(false);
    }
  }

  const filteredCategories = categories.filter(
    (category) =>
      category.name
        .toLowerCase()
        .includes(categorySearch.toLowerCase())
  );

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

      if (!form.price || Number(form.price) <= 0) {
        alert("Enter a valid price.");
        return;
      }

      if (!imageFile) {
        alert("Please select an image.");
        return;
      }

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

      setForm({
        name: "",
        description: "",
        category: "",
        category_id: "",
        stall_id: "",
        price: "",
        available: true,
      });

      setSelectedCategory(null);
      setCategorySearch("");
      setCategoryDropdownOpen(false);
      setCategoryError("");
      setStallError("");
      setImageFile(null);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Add food error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to add food."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

        <h2 className="mb-5 text-2xl font-bold text-black">
          Add Food
        </h2>

        {/* Food Name */}
        <input
          type="text"
          name="name"
          placeholder="Food Name"
          value={form.name}
          onChange={handleChange}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {/* Description */}
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />

        {/* Category */}
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

              {categoryLoading && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Loading categories...
                </div>
              )}

              {!categoryLoading &&
                categoryError && (
                  <div className="px-4 py-3 text-sm text-red-500">
                    {categoryError}
                  </div>
                )}

              {!categoryLoading &&
                !categoryError &&
                filteredCategories.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    No categories found.
                  </div>
                )}

              {!categoryLoading &&
                !categoryError &&
                filteredCategories.length > 0 && (
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

                            setForm((prev) => ({
                              ...prev,
                              category:
                                category.name,
                              category_id:
                                category.id,
                            }));

                            setCategoryDropdownOpen(
                              false
                            );

                            setCategorySearch("");
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

        {/* Stall */}
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

        {/* Price */}
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

        {/* Image */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setImageFile(
                e.target.files[0]
              );
            }
          }}
          className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-black"
        />

        {/* Image Preview */}
        {imageFile && (
          <div className="mb-4">

            <img
              src={URL.createObjectURL(
                imageFile
              )}
              alt="Preview"
              className="h-32 w-32 rounded-lg border object-cover"
            />

            <p className="mt-1 text-sm text-gray-500">
              {imageFile.name}
            </p>

          </div>
        )}

        {/* Availability */}
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

        {/* Buttons */}
        <div className="flex justify-end gap-2">

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-gray-300 px-4 py-2 text-black hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>

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