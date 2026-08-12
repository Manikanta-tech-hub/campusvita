"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import CategoryStats from "./CategoryStats";
import CategoryFilters from "./CategoryFilters";
import CategoryTable from "./CategoryTable";
import AddCategoryModal from "./AddCategoryModal";
import EditCategoryModal from "./EditCategoryModal";
import DeleteCategoryModal from "./DeleteCategoryModal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

export type Category = {
  id: string;
  name: string;
  description: string;
  image: string;
  active: boolean;
  food_count: number;
  created_at?: string | null;
};

type Stats = {
  total_categories: number;
  active_categories: number;
  inactive_categories: number;
  total_foods: number;
};

export default function CategoryManagement() {

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [stats, setStats] =
    useState<Stats>({
      total_categories: 0,
      active_categories: 0,
      inactive_categories: 0,
      total_foods: 0,
    });

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [sort, setSort] =
    useState("LATEST");

  const [page, setPage] =
    useState(1);

  const [pages, setPages] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showAdd, setShowAdd] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<Category | null>(null);

  const [deletingCategory, setDeletingCategory] =
    useState<Category | null>(null);

  const requestRef =
    useRef<AbortController | null>(null);


    const loadCategories = useCallback(
      async (showLoading = true) => {
    
        if (showLoading) {
          setLoading(true);
        }

      setError("");

      requestRef.current?.abort();

      const controller =
        new AbortController();

      requestRef.current =
        controller;

      try {

        const token =
          localStorage.getItem(
            "access_token"
          ) ||
          localStorage.getItem(
            "token"
          );

        const params =
          new URLSearchParams({
            search,
            status_filter: status,
            sort,
            page: String(page),
            limit: "10",
          });

        const response =
          await fetch(
            `${API_URL}/admin/categories?${params.toString()}`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              signal:
                controller.signal,
              cache: "no-store",
            }
          );

        if (!response.ok) {

          const body =
            await response.json()
              .catch(() => null);

          throw new Error(
            body?.detail ||
            "Failed to load categories"
          );
        }

        const data =
          await response.json();

        setCategories(
          Array.isArray(data.categories)
            ? data.categories
            : []
        );

        setStats(
          data.stats || {
            total_categories: 0,
            active_categories: 0,
            inactive_categories: 0,
            total_foods: 0,
          }
        );

        setPages(
          data.pagination?.pages || 0
        );

      } catch (err: any) {

        if (
          err?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Category load error:",
          err
        );

        setCategories([]);

        setError(
          err?.message ||
          "Network error. Please try again."
        );

      } finally {
        setLoading(false);
      }
    },
    [
      search,
      status,
      sort,
      page,
    ]
  );

  useEffect(() => {

    loadCategories();

    return () => {
      requestRef.current?.abort();
    };

  }, [loadCategories]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  return (
    <section className="mt-10">

      <div className="mb-6">

        <p className="uppercase tracking-[4px] text-orange-500 text-xs font-semibold">
          FOOD ORGANIZATION
        </p>

        <h2 className="text-3xl font-bold text-white mt-2">
          Category Management
        </h2>

        <p className="text-zinc-400 mt-2">
          Manage real food categories from the database.
        </p>

      </div>

      <CategoryStats stats={stats} />

      <CategoryFilters
        search={search}
        status={status}
        sort={sort}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onSortChange={setSort}
        onAdd={() => setShowAdd(true)}
      />

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
          <p className="text-red-400 font-medium">
            {error}
          </p>

          <button
            onClick={() =>
              loadCategories()
            }
            className="mt-3 text-sm text-white underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      <CategoryTable
        categories={categories}
        loading={loading}
        onEdit={setEditingCategory}
        onDelete={setDeletingCategory}
        onRefresh={() =>
          loadCategories(false)
        }
      />

      {!loading &&
        !error &&
        pages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-6">

            <button
              disabled={page <= 1}
              onClick={() =>
                setPage((p) => p - 1)
              }
              className="px-4 py-2 rounded-xl bg-zinc-800 text-white disabled:opacity-40"
            >
              Previous
            </button>

            <span className="text-zinc-400">
              Page {page} of {pages}
            </span>

            <button
              disabled={page >= pages}
              onClick={() =>
                setPage((p) => p + 1)
              }
              className="px-4 py-2 rounded-xl bg-zinc-800 text-white disabled:opacity-40"
            >
              Next
            </button>

          </div>
        )}

      <AddCategoryModal
        open={showAdd}
        onClose={() =>
          setShowAdd(false)
        }
        onSuccess={() =>
          loadCategories(false)
        }
      />

      <EditCategoryModal
        open={!!editingCategory}
        category={editingCategory}
        onClose={() =>
          setEditingCategory(null)
        }
        onSuccess={() => {
          setEditingCategory(null);
          loadCategories(false);
        }}
      />

      <DeleteCategoryModal
        open={!!deletingCategory}
        category={deletingCategory}
        onClose={() =>
          setDeletingCategory(null)
        }
        onSuccess={() => {
          setDeletingCategory(null);
          loadCategories(false);
        }}
      />

    </section>
  );
}