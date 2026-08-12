"use client";

import {
  Search,
  Plus,
} from "lucide-react";

type Props = {
  search: string;
  status: string;
  sort: string;

  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onAdd: () => void;
};

export default function CategoryFilters({
  search,
  status,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onAdd,
}: Props) {

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-8">

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="relative">

          <Search
            size={18}
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-zinc-500
            "
          />

          <input
            value={search}
            onChange={(e) =>
              onSearchChange(
                e.target.value
              )
            }
            placeholder="Search categories..."
            className="
              w-full
              bg-zinc-800
              border
              border-zinc-700
              rounded-xl
              py-3
              pl-11
              pr-4
              text-white
              placeholder:text-zinc-500
              outline-none
              focus:border-orange-500
            "
          />

        </div>

        <select
          value={status}
          onChange={(e) =>
            onStatusChange(
              e.target.value
            )
          }
          className="
            bg-zinc-800
            border
            border-zinc-700
            rounded-xl
            py-3
            px-4
            text-white
            outline-none
            focus:border-orange-500
          "
        >
          <option value="ALL">
            All Status
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>

        <select
          value={sort}
          onChange={(e) =>
            onSortChange(
              e.target.value
            )
          }
          className="
            bg-zinc-800
            border
            border-zinc-700
            rounded-xl
            py-3
            px-4
            text-white
            outline-none
            focus:border-orange-500
          "
        >
          <option value="LATEST">
            Latest
          </option>

          <option value="OLDEST">
            Oldest
          </option>

          <option value="NAME_ASC">
            Name A-Z
          </option>

          <option value="NAME_DESC">
            Name Z-A
          </option>
        </select>

        <button
          onClick={onAdd}
          className="
            flex
            items-center
            justify-center
            gap-2
            bg-orange-500
            hover:bg-orange-600
            text-white
            font-semibold
            rounded-xl
            px-5
            py-3
            transition
          "
        >
          <Plus size={18} />

          Add Category
        </button>

      </div>

    </div>
  );
}