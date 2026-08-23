"use client";

import Image from "next/image";
import { Pencil, Trash2, ImageOff } from "lucide-react";

type Food = {
  id?: string;
  name: string;
  description: string;
  category: string;
  category_id: string;
  stall_id: string;
  price: number;
  image: string;
  available: boolean;
};

type Props = {
  foods: Food[];
  onEdit: (food: Food) => void;
  onDelete: (food: Food) => void;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export default function FoodTable({
  foods,
  onEdit,
  onDelete,
}: Props) {
  if (foods.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-14 text-center">
        <ImageOff
          size={48}
          className="mx-auto text-zinc-600"
        />

        <h2 className="mt-5 text-xl font-semibold">
          No Foods Found
        </h2>

        <p className="mt-2 text-zinc-500">
          Try changing filters or add a new food.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">

      {/* ================= DESKTOP ================= */}

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full">

          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-4 text-left">
                Food
              </th>

              <th className="px-6 py-4 text-left">
                Category
              </th>

              <th className="px-6 py-4 text-left">
                Price
              </th>

              <th className="px-6 py-4 text-left">
                Status
              </th>

              <th className="px-6 py-4 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {foods.map((food) => {
              const imageUrl =
                food.image?.startsWith("http")
                  ? food.image
                  : `${API_URL}${food.image || ""}`;

              return (
                <tr
                  key={
                    food.id ||
                    `${food.name}-${food.stall_id}`
                  }
                  className="border-t border-zinc-800 transition hover:bg-zinc-800/40"
                >

                  {/* FOOD */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">

                      <Image
                        src={imageUrl}
                        alt={food.name}
                        width={60}
                        height={60}
                        className="rounded-xl object-cover"
                        unoptimized
                      />

                      <div>
                        <h3 className="font-semibold">
                          {food.name}
                        </h3>

                        <p className="line-clamp-1 text-sm text-zinc-400">
                          {food.description}
                        </p>
                      </div>

                    </div>
                  </td>

                  {/* CATEGORY */}
                  <td className="px-6">
                    {food.category}
                  </td>

                  {/* PRICE */}
                  <td className="px-6">
                    ₹{food.price}
                  </td>

                  {/* STATUS */}
                  <td className="px-6">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        food.available
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {food.available
                        ? "Available"
                        : "Out of Stock"}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6">
                    <div className="flex justify-end gap-3">

                      <button
                        type="button"
                        onClick={() => onEdit(food)}
                        className="rounded-lg bg-blue-500/15 p-2 hover:bg-blue-500/30"
                        title="Edit food"
                      >
                        <Pencil
                          size={18}
                          className="text-blue-400"
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(food)}
                        className="rounded-lg bg-red-500/15 p-2 hover:bg-red-500/30"
                        title="Delete food"
                      >
                        <Trash2
                          size={18}
                          className="text-red-400"
                        />
                      </button>

                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>
      </div>

      {/* ================= MOBILE ================= */}

      <div className="lg:hidden">

        {foods.map((food) => {
          const imageUrl =
            food.image?.startsWith("http")
              ? food.image
              : `${API_URL}${food.image || ""}`;

          return (
            <div
              key={
                food.id ||
                `${food.name}-${food.stall_id}`
              }
              className="border-b border-zinc-800 p-5 last:border-b-0"
            >

              <div className="flex gap-4">

                <Image
                  src={imageUrl}
                  alt={food.name}
                  width={75}
                  height={75}
                  className="rounded-xl object-cover"
                  unoptimized
                />

                <div className="flex-1">

                  <h3 className="font-semibold">
                    {food.name}
                  </h3>

                  <p className="text-sm text-zinc-400">
                    {food.category}
                  </p>

                  <p className="mt-2 font-semibold text-orange-400">
                    ₹{food.price}
                  </p>

                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs ${
                      food.available
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {food.available
                      ? "Available"
                      : "Out of Stock"}
                  </span>

                </div>

              </div>

              <div className="mt-4 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() => onEdit(food)}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-white"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(food)}
                  className="rounded-lg bg-red-500 px-4 py-2 text-white"
                >
                  Delete
                </button>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
