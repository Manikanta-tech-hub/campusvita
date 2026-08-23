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
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (food) {
      setForm({
        name: food.name || "",
        description: food.description || "",
        category: food.category || "",
        category_id: food.category_id || "",
        stall_id: food.stall_id || "",
        price: food.price ?? "",
        image: food.image || "",
        available: food.available ?? true,
      });
    }
  }, [food]);

  if (!open || !food) {
    return null;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

  async function handleSubmit() {
    if (!food) return;
  
    try {
      setLoading(true);
  
      const token = getAccessToken("ADMIN");
  
      if (!token) {
        alert("Please login again");
        return;
      }
  
      if (!form.name.trim()) {
        alert("Food name is required");
        return;
      }
  
      if (!form.description.trim()) {
        alert("Description is required");
        return;
      }
  
      if (!form.category_id) {
        alert("Category ID is missing");
        return;
      }
  
      if (!form.stall_id) {
        alert("Stall ID is missing");
        return;
      }
  
      if (!form.price || Number(form.price) <= 0) {
        alert("Enter a valid price");
        return;
      }
  
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
        },
        token
      );
  
      alert("Food Updated Successfully");
  
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Update food error:", error);
  
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update food"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">

        <h2 className="mb-6 text-2xl font-bold text-white">
          Edit Food
        </h2>

        <div className="space-y-4">

          {/* Food Name */}
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

          {/* Description */}
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

          {/* Category */}
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

          {/* Stall ID */}
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

          {/* Price */}
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

          {/* Image */}
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

          {/* Available */}
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

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-zinc-700 px-5 py-2 text-white hover:bg-zinc-600 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-lg bg-orange-500 px-5 py-2 font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Food"}
          </button>

        </div>

      </div>
    </div>
  );
}
