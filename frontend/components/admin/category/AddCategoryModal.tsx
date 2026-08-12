"use client";

import { useState } from "react";

type AddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function AddCategoryModal({
  open,
  onClose,
  onSuccess,
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    try {
      setError("");

      if (!name.trim()) {
        setError("Category name is required.");
        return;
      }

      setLoading(true);

      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Your session has expired. Please login again."
        );
        return;
      }

      const formData = new FormData();

      formData.append(
        "name",
        name.trim()
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "active",
        String(active)
      );

      if (imageFile) {
        formData.append(
          "image",
          imageFile
        );
      }

      const response = await fetch(
        `${API_URL}/admin/categories`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          "Failed to create category."
        );
      }

      console.log(
        "✅ Category created:",
        data
      );

      // Reset form
      setName("");
      setDescription("");
      setActive(true);
      setImageFile(null);
      setError("");

      // Refresh category page
      onSuccess();

      // Close modal
      onClose();

    } catch (err: any) {
      console.error(
        "❌ Create category error:",
        err
      );

      setError(
        err?.message ||
        "Failed to create category."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">

      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">

        {/* Header */}
        <div className="mb-5">

          <h2 className="text-2xl font-bold text-white">
            Add Category
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            Create a new food category.
          </p>

        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Category Name */}
        <div className="mb-4">

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Category Name
          </label>

          <input
            type="text"
            placeholder="e.g. Biryani"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            disabled={loading}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />

        </div>

        {/* Description */}
        <div className="mb-4">

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Description
          </label>

          <textarea
            placeholder="Enter category description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            disabled={loading}
            rows={3}
            className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-3 text-white placeholder:text-zinc-500 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />

        </div>

        {/* Image */}
        <div className="mb-4">

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Category Image
            <span className="ml-1 text-zinc-500">
              (Optional)
            </span>
          </label>

          <input
            type="file"
            accept="image/*"
            disabled={loading}
            onChange={(e) => {

              if (
                e.target.files &&
                e.target.files.length > 0
              ) {
                setImageFile(
                  e.target.files[0]
                );
              }

            }}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-orange-600"
          />

          {imageFile && (
            <p className="mt-2 text-xs text-zinc-400">
              Selected: {imageFile.name}
            </p>
          )}

        </div>

        {/* Active */}
        <label className="mb-6 flex cursor-pointer items-center gap-3">

          <input
            type="checkbox"
            checked={active}
            disabled={loading}
            onChange={(e) =>
              setActive(
                e.target.checked
              )
            }
            className="h-4 w-4 accent-orange-500"
          />

          <span className="text-sm text-zinc-300">
            Active
          </span>

        </label>

        {/* Buttons */}
        <div className="flex justify-end gap-3">

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg bg-zinc-700 px-5 py-2.5 font-medium text-white transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : "Add Category"}
          </button>

        </div>

      </div>

    </div>
  );
}