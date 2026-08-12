"use client";

import { useEffect, useState } from "react";

import FoodHeader from "@/components/admin/food/FoodHeader";
import AddFoodModal from "@/components/admin/food/AddFoodModal";
import FoodStats from "@/components/admin/food/FoodStats";
import FoodFilters from "@/components/admin/food/FoodFilters";
import FoodTable from "@/components/admin/food/FoodTable";
import EditFoodModal from "@/components/admin/food/EditFoodModal";
import DeleteFoodModal from "@/components/admin/food/DeleteFoodModal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

type Food = {
  id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
};

export default function FoodManagementPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const [foods, setFoods] = useState<Food[]>([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("LATEST");

  const [editingFood, setEditingFood] =
    useState<Food | null>(null);

  const [deletingFood, setDeletingFood] =
    useState<Food | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    ...new Set(
      foods.map((food) => food.category).filter(Boolean)
    ),
  ];

  async function loadFoods() {
    try {
      setLoading(true);
      setError("");

      console.log("Loading foods from:", `${API_URL}/foods`);

      const response = await fetch(
        `${API_URL}/foods`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      console.log(
        "Foods API status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load foods (${response.status})`
        );
      }

      const data = await response.json();

      console.log("Foods API response:", data);

      const foodList = Array.isArray(data)
        ? data
        : Array.isArray(data.foods)
        ? data.foods
        : [];

      console.log(
        "Foods loaded:",
        foodList
      );

      setFoods(foodList);

    } catch (err: any) {
      console.error(
        "Food load error:",
        err
      );

      setFoods([]);

      setError(
        err?.message ||
        "Failed to load foods"
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  const filteredFoods = [...foods]
    .filter((food) => {
      const matchesSearch =
        food.name
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesCategory =
        category === "ALL" ||
        food.category === category;

      const matchesStatus =
        status === "ALL" ||
        (status === "AVAILABLE"
          ? food.available
          : !food.available);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    })
    .sort((a, b) => {
      switch (sort) {
        case "NAME_ASC":
          return a.name.localeCompare(
            b.name
          );

        case "NAME_DESC":
          return b.name.localeCompare(
            a.name
          );

        case "PRICE_LOW":
          return a.price - b.price;

        case "PRICE_HIGH":
          return b.price - a.price;

        default:
          return 0;
      }
    });

  return (
    <div>
      <FoodHeader
        onAddFood={() =>
          setShowAddModal(true)
        }
      />

      <FoodStats
        foods={foods}
      />

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-red-400">
            {error}
          </p>

          <button
            onClick={loadFoods}
            className="mt-2 text-sm text-white underline"
          >
            Try again
          </button>
        </div>
      )}

      <FoodFilters
        search={search}
        category={category}
        status={status}
        sort={sort}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
        onSortChange={setSort}
      />

      {loading ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-12 text-center">
          <p className="text-zinc-400">
            Loading food items...
          </p>
        </div>
      ) : (
        <FoodTable
          foods={filteredFoods}
          onEdit={(food) => {
            setEditingFood(food);
            setEditOpen(true);
          }}
          onDelete={(food) => {
            setDeletingFood(food);
            setDeleteOpen(true);
          }}
        />
      )}

      <AddFoodModal
        open={showAddModal}
        onClose={() =>
          setShowAddModal(false)
        }
        onSuccess={loadFoods}
      />

      <EditFoodModal
        open={editOpen}
        food={editingFood}
        onClose={() => {
          setEditOpen(false);
          setEditingFood(null);
        }}
        onSuccess={() => {
          setEditOpen(false);
          setEditingFood(null);
          loadFoods();
        }}
      />

      <DeleteFoodModal
        open={deleteOpen}
        foodName={
          deletingFood?.name || ""
        }
        onClose={() => {
          setDeleteOpen(false);
          setDeletingFood(null);
        }}
        onSuccess={() => {
          setDeleteOpen(false);
          setDeletingFood(null);
          loadFoods();
        }}
      />
    </div>
  );
}