"use client";

import Image from "next/image";

import {
  Pencil,
  Trash2,
  ImageOff,
  Loader2,
  Power,
} from "lucide-react";

import type { Category } from "./CategoryManagement";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type Props = {
  categories: Category[];
  loading: boolean;

  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onRefresh: () => void;
};

export default function CategoryTable({
  categories,
  loading,
  onEdit,
  onDelete,
  onRefresh,
}: Props) {

  async function toggleStatus(
    category: Category
  ) {

    try {

      const token =
        localStorage.getItem(
          "access_token"
        ) ||
        localStorage.getItem(
          "token"
        );

      const response =
        await fetch(
          `${API_URL}/admin/categories/${category.id}/status?active=${!category.active}`,
          {
            method: "PATCH",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {

        const body =
          await response.json()
            .catch(() => null);

        throw new Error(
          body?.detail ||
          "Failed to update status"
        );
      }

      // Always get the new state from backend.
      onRefresh();

    } catch (error) {

      console.error(
        "Category status error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update category status"
      );
    }
  }

  if (loading) {
    return (
      <div className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-16
        flex
        justify-center
      ">
        <Loader2
          className="animate-spin text-orange-500"
          size={32}
        />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="
        bg-zinc-900
        border
        border-zinc-800
        rounded-2xl
        p-16
        text-center
      ">
        <ImageOff
          size={48}
          className="mx-auto text-zinc-600"
        />

        <h3 className="
          text-xl
          font-semibold
          text-white
          mt-5
        ">
          No categories found
        </h3>

        <p className="
          text-zinc-500
          mt-2
        ">
          No category records match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="
      overflow-hidden
      rounded-2xl
      border
      border-zinc-800
      bg-zinc-900
    ">

      {/* Desktop */}

      <div className="hidden lg:block overflow-x-auto">

        <table className="w-full">

          <thead className="bg-zinc-800">

            <tr>

              <th className="px-6 py-4 text-left">
                Category
              </th>

              <th className="px-6 py-4 text-left">
                Description
              </th>

              <th className="px-6 py-4 text-left">
                Foods
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

            {categories.map(
              (category) => {

                const imageUrl =
                  category.image
                    ? (
                        category.image
                          .startsWith("http")
                          ? category.image
                          : `${API_URL}${category.image}`
                      )
                    : "";

                return (
                  <tr
                    key={category.id}
                    className="
                      border-t
                      border-zinc-800
                      hover:bg-zinc-800/40
                      transition
                    "
                  >

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-4">

                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={category.name}
                            width={60}
                            height={60}
                            className="
                              rounded-xl
                              object-cover
                            "
                            unoptimized
                          />
                        ) : (
                          <div className="
                            w-[60px]
                            h-[60px]
                            rounded-xl
                            bg-zinc-800
                            flex
                            items-center
                            justify-center
                          ">
                            <ImageOff
                              size={22}
                              className="text-zinc-600"
                            />
                          </div>
                        )}

                        <div>
                          <h3 className="
                            font-semibold
                            text-white
                          ">
                            {category.name}
                          </h3>

                          <p className="
                            text-xs
                            text-zinc-500
                            mt-1
                          ">
                            {category.id}
                          </p>
                        </div>

                      </div>

                    </td>

                    <td className="
                      px-6
                      text-zinc-400
                      max-w-xs
                    ">
                      <p className="line-clamp-2">
                        {category.description ||
                          "No description"}
                      </p>
                    </td>

                    <td className="
                      px-6
                      text-zinc-300
                    ">
                      {category.food_count}
                    </td>

                    <td className="px-6">

                      <button
                        onClick={() =>
                          toggleStatus(category)
                        }
                        className={`
                          px-3
                          py-1
                          rounded-full
                          text-xs
                          font-semibold
                          ${
                            category.active
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }
                        `}
                      >
                        {category.active
                          ? "Active"
                          : "Inactive"}
                      </button>

                    </td>

                    <td className="px-6">

                      <div className="
                        flex
                        justify-end
                        gap-3
                      ">

                        <button
                          onClick={() =>
                            toggleStatus(
                              category
                            )
                          }
                          className="
                            p-2
                            rounded-lg
                            bg-zinc-800
                            hover:bg-zinc-700
                          "
                          title={
                            category.active
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <Power
                            size={18}
                            className={
                              category.active
                                ? "text-green-400"
                                : "text-zinc-400"
                            }
                          />
                        </button>

                        <button
                          onClick={() =>
                            onEdit(category)
                          }
                          className="
                            p-2
                            rounded-lg
                            bg-blue-500/15
                            hover:bg-blue-500/30
                          "
                        >
                          <Pencil
                            size={18}
                            className="text-blue-400"
                          />
                        </button>

                        <button
                          onClick={() =>
                            onDelete(category)
                          }
                          className="
                            p-2
                            rounded-lg
                            bg-red-500/15
                            hover:bg-red-500/30
                          "
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
              }
            )}

          </tbody>

        </table>

      </div>

      {/* Mobile */}

      <div className="lg:hidden">

        {categories.map(
          (category) => {

            const imageUrl =
              category.image
                ? (
                    category.image
                      .startsWith("http")
                      ? category.image
                      : `${API_URL}${category.image}`
                  )
                : "";

            return (
              <div
                key={category.id}
                className="
                  border-b
                  border-zinc-800
                  p-5
                "
              >

                <div className="flex gap-4">

                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={category.name}
                      width={75}
                      height={75}
                      className="rounded-xl object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="
                      w-[75px]
                      h-[75px]
                      rounded-xl
                      bg-zinc-800
                      flex
                      items-center
                      justify-center
                    ">
                      <ImageOff
                        className="text-zinc-600"
                      />
                    </div>
                  )}

                  <div className="flex-1">

                    <h3 className="
                      font-semibold
                      text-white
                    ">
                      {category.name}
                    </h3>

                    <p className="
                      text-sm
                      text-zinc-400
                      mt-1
                    ">
                      {category.description ||
                        "No description"}
                    </p>

                    <p className="
                      text-orange-400
                      font-semibold
                      mt-2
                    ">
                      {category.food_count} foods
                    </p>

                    <button
                      onClick={() =>
                        toggleStatus(category)
                      }
                      className={`
                        mt-2
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-semibold
                        ${
                          category.active
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }
                      `}
                    >
                      {category.active
                        ? "Active"
                        : "Inactive"}
                    </button>

                  </div>

                </div>

                <div className="
                  flex
                  justify-end
                  gap-3
                  mt-4
                ">

                  <button
                    onClick={() =>
                      onEdit(category)
                    }
                    className="
                      px-4
                      py-2
                      bg-blue-500
                      text-white
                      rounded-lg
                    "
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      onDelete(category)
                    }
                    className="
                      px-4
                      py-2
                      bg-red-500
                      text-white
                      rounded-lg
                    "
                  >
                    Delete
                  </button>

                </div>

              </div>
            );
          }
        )}

      </div>

    </div>
  );
}