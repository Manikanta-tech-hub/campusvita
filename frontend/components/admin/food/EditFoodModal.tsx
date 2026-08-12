"use client";

import { useEffect, useState } from "react";
import { updateFood } from "@/app/lib/api";

type Food = {
  name: string;
  description: string;
  category: string;
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
    price: 0,
    image: "",
    available: true,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (food) {
      setForm(food);
    }
  }, [food]);

  if (!open || !food) return null;

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "price" ? (value === "" ? "" : Number(value)) : value,
    }));
  }

  async function handleSubmit() {
    try {
      setLoading(true);

      const token = localStorage.getItem("access_token");

      if (!token) {
        alert("Please login again");
        return;
      }

      await updateFood(food!.name, form, token);

      alert("Food Updated Successfully");

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update food");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-xl border border-zinc-800">

        <h2 className="text-2xl font-bold text-white mb-6">
          Edit Food
        </h2>

        <div className="space-y-4">

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
            placeholder="Food Name"
          />

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
            placeholder="Description"
          />

          <input
            name="category"
            value={form.category}
            onChange={handleChange}
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
            placeholder="Category"
          />

          <input
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
            placeholder="Price"
          />

          <input
            name="image"
            value={form.image}
            onChange={handleChange}
            className="w-full bg-zinc-800 rounded-lg p-3 text-white"
            placeholder="Image URL"
          />

          <label className="flex items-center gap-3 text-white">

            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) =>
                setForm({
                  ...form,
                  available: e.target.checked,
                })
              }
            />

            Available

          </label>

        </div>

        <div className="flex justify-end gap-3 mt-6">

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={handleSubmit}
            className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600"
          >
            {loading ? "Updating..." : "Update Food"}
          </button>

        </div>

      </div>

    </div>
  );
}