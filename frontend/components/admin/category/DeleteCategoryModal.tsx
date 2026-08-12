"use client";

import type { Category } from "./CategoryManagement";

type Props = {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteCategoryModal({
  open,
  category,
  onClose,
  onSuccess,
}: Props) {
  if (!open || !category) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-xl font-bold text-white">
          Delete Category
        </h2>

        <p className="mt-2 text-zinc-400">
          Are you sure you want to delete "{category.name}"?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-white"
          >
            Cancel
          </button>

          <button
            onClick={onSuccess}
            className="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}