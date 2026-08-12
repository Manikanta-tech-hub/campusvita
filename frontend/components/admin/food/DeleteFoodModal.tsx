"use client";

import { deleteFood } from "@/app/lib/api";

type Props = {
  open: boolean;
  foodName: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function DeleteFoodModal({
  open,
  foodName,
  onClose,
  onSuccess,
}: Props) {
  if (!open) return null;

  async function handleDelete() {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        alert("Login again");
        return;
      }
      console.log("food Name:",foodName);
      await deleteFood(foodName, token);
     
      alert("Food Deleted Successfully");

      onSuccess();

      onClose();
    } catch (err) {
      console.error(err);
      alert("Delete Failed");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">

      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-md border border-zinc-800">

        <h2 className="text-xl font-bold text-red-500">
          Delete Food
        </h2>

        <p className="text-gray-400 mt-4">
          Are you sure you want to delete
        </p>

        <p className="text-white font-semibold mt-2">
          {foodName} ?
        </p>

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-700"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700"
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}