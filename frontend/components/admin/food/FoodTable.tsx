"use client";

import Image from "next/image";
import { Pencil, Trash2, ImageOff } from "lucide-react";

type Food = {
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
};

type Props = {
  foods: Food[];
  onEdit: (food: Food) => void;
  onDelete: (food: Food) => void;
};

export default function FoodTable({
  foods,
  onEdit,
  onDelete,
}: Props) {
  if (foods.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-14 text-center">
        <ImageOff size={48} className="mx-auto text-zinc-600" />

        <h2 className="text-xl font-semibold mt-5">
          No Foods Found
        </h2>

        <p className="text-zinc-500 mt-2">
          Try changing filters or add a new food.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">

      {/* Desktop */}
      <div className="hidden lg:block overflow-x-auto">

        <table className="w-full">

          <thead className="bg-zinc-800">
            <tr>
              <th className="px-6 py-4 text-left">Food</th>
              <th className="px-6 py-4 text-left">Category</th>
              <th className="px-6 py-4 text-left">Price</th>
              <th className="px-6 py-4 text-left">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {foods.map((food) => {
              const imageUrl = food.image.startsWith("http")
                ? food.image
                : `http://127.0.0.1:8000${food.image}`;

              return (
                <tr
                  key={food.name}
                  className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                >
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

                        <p className="text-sm text-zinc-400 line-clamp-1">
                          {food.description}
                        </p>
                      </div>

                    </div>

                  </td>

                  <td className="px-6">
                    {food.category}
                  </td>

                  <td className="px-6">
                    ₹{food.price}
                  </td>

                  <td className="px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
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

                  <td className="px-6">

                    <div className="flex justify-end gap-3">

                      <button
                        onClick={() => onEdit(food)}
                        className="p-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/30"
                      >
                        <Pencil
                          size={18}
                          className="text-blue-400"
                        />
                      </button>

                      <button
                        onClick={() => onDelete(food)}
                        className="p-2 rounded-lg bg-red-500/15 hover:bg-red-500/30"
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

      {/* Mobile */}

      <div className="lg:hidden">

        {foods.map((food) => {
          const imageUrl = food.image.startsWith("http")
            ? food.image
            : `http://127.0.0.1:8000${food.image}`;

          return (
            <div
              key={food.name}
              className="border-b border-zinc-800 p-5"
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

                  <p className="text-orange-400 font-semibold mt-2">
                    ₹{food.price}
                  </p>

                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${
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

              <div className="flex justify-end gap-3 mt-4">

                <button
                  onClick={() => onEdit(food)}
                  className="px-4 py-2 bg-blue-500 rounded-lg"
                >
                  Edit
                </button>

                <button
                  onClick={() => onDelete(food)}
                  className="px-4 py-2 bg-red-500 rounded-lg"
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