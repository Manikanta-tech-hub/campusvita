"use client";

import { useEffect, useState } from "react";
import { updateFood } from "@/app/lib/api";
import { getAccessToken } from "@/app/lib/auth/session";

type Food = {
  name: string;
  description: string;
  category: string;
  category_id: string;
  stall_id: string;
  price: number | "";
  image: string;
  available: boolean;
  is_veg: boolean | null;
};

type Props = {
  open: boolean;
  food: Food | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function EditFoodModal({
  open,
  food,
  onClose,
  onSuccess,
}: Props) {
  const [form, setForm] = useState<Food>({
    name: "",
    description: "",
    category: "",
    category_id: "",
    stall_id: "",
    price: "",
    image: "",
    available: true,
    is_veg: null,
  });

  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // LOAD FOOD INTO FORM
  // --------------------------------------------------

  useEffect(() => {
    if (!food) return;

    setForm({
      name: food.name || "",
      description: food.description || "",
      category: food.category || "",
      category_id: food.category_id || "",
      stall_id: food.stall_id || "",
      price: food.price ?? "",
      image: food.image || "",
      available: food.available ?? true,
      is_veg: food.is_veg ?? null,
    });
  }, [food]);

  if (!open || !food) {
    return null;
  }

  // --------------------------------------------------
  // HANDLE INPUT CHANGES
  // --------------------------------------------------

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  }

  // --------------------------------------------------
  // UPDATE FOOD
  // --------------------------------------------------

  async function handleSubmit() {
    if (!food) return;

    try {
      setLoading(true);

      const token = getAccessToken("ADMIN");

      if (!token) {
        alert("Please login again.");
        return;
      }

      // -----------------------------
      // VALIDATION
      // -----------------------------

      if (!form.name.trim()) {
        alert("Food name is required.");
        return;
      }

      if (!form.description.trim()) {
        alert("Description is required.");
        return;
      }

      if (!form.category_id) {
        alert("Category ID is missing.");
        return;
      }

      if (!form.stall_id) {
        alert("Stall ID is missing.");
        return;
      }

      if (!form.price || Number(form.price) <= 0) {
        alert("Enter a valid price.");
        return;
      }

      // -----------------------------
      // UPDATE
      // -----------------------------

      await updateFood(
        food.name,
        {
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          category_id: form.category_id,
          stall_id: form.stall_id,
          price: Number(form.price),
          image: form.image.trim(),
          available: form.available,

          // IMPORTANT:
          // Preserve true / false / null
          is_veg: form.is_veg,
        },
        token
      );

      alert("Food Updated Successfully.");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update food error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update food."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">

        {/* HEADER */}

        <h2 className="mb-6 text-2xl font-bold text-white">
          Edit Food
        </h2>

        <div className="space-y-4">

          {/* FOOD NAME */}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Food Name
            </label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-orange-500"
              placeholder="Food Name"
            />
          </div>

          {/* DESCRIPTION */}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={loading}
              rows={3}
              className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-orange-500"
              placeholder="Description"
            />
          </div>

          {/* CATEGORY */}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Category
            </label>

            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-orange-500"
              placeholder="Category"
            />
          </div>

          {/* STALL ID */}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Stall ID
            </label>

            <input
              name="stall_id"
              value={form.stall_id}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-orange-500"
              placeholder="Stall ID"
            />
          </div>

          {/* PRICE */}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Price
            </label>

            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              disabled={loading}
              min="1"
              step="0.01"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-orange-500"
              placeholder="Price"
            />
          </div>

          {/* IMAGE */}

          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Image URL
            </label>

            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-white outline-none focus:border-orange-500"
              placeholder="Image URL"
            />
          </div>

          {/* ==========================================
              FOOD TYPE
          ========================================== */}

          <div>
            <label className="mb-2 block text-sm text-zinc-300">
              Food Type
            </label>

            <div className="grid grid-cols-3 gap-2">

              {/* VEG */}

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    is_veg: true,
                  }))
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  form.is_veg === true
                    ? "border-green-500 bg-green-500/10 text-green-400"
                    : "border-zinc-700 text-zinc-400 hover:border-green-500/50 hover:text-green-400"
                }`}
              >
                🟢 VEG
              </button>

              {/* NON-VEG */}

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    is_veg: false,
                  }))
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  form.is_veg === false
                    ? "border-red-500 bg-red-500/10 text-red-400"
                    : "border-zinc-700 text-zinc-400 hover:border-red-500/50 hover:text-red-400"
                }`}
              >
                🔴 NON-VEG
              </button>

              {/* UNKNOWN */}

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    is_veg: null,
                  }))
                }
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  form.is_veg === null
                    ? "border-zinc-500 bg-zinc-800 text-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"
                }`}
              >
                Unknown
              </button>

            </div>
          </div>

          {/* ==========================================
              AVAILABLE
          ========================================== */}

          <label className="flex items-center gap-3 text-white">
            <input
              type="checkbox"
              checked={form.available}
              disabled={loading}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  available: e.target.checked,
                }))
              }
              className="h-4 w-4"
            />

            <span>Available</span>
          </label>

        </div>

        {/* ==========================================
            ACTION BUTTONS
        ========================================== */}

        <div className="mt-6 flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-zinc-700 px-5 py-2 text-white transition-colors hover:bg-zinc-600 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-lg bg-orange-500 px-5 py-2 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Food"}
          </button>

        </div>

      </div>
    </div>
  );
}