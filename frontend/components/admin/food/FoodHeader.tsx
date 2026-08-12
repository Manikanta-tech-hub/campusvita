"use client";

import { Plus } from "lucide-react";

type Props = {
  onAddFood: () => void;
};

export default function FoodHeader({ onAddFood }: Props) {
  return (
    <div className="mb-8">

      {/* Breadcrumb */}

      <div className="flex items-center text-sm text-zinc-400 mb-3">
        <span>CampusVita</span>

        <span className="mx-2">›</span>

        <span className="text-white font-medium">
          Food Management
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

        <div>

          <p className="uppercase tracking-[4px] text-orange-500 text-xs font-semibold">
            CANTEEN ADMIN
          </p>

          <h1 className="text-4xl font-bold text-white mt-2">
            Food Management
          </h1>

          <p className="text-zinc-400 mt-2">
            Manage food items available in the canteen.
          </p>

        </div>

        <button
          onClick={onAddFood}
          className="
          flex
          items-center
          gap-2
          bg-orange-500
          hover:bg-orange-600
          transition
          px-6
          py-3
          rounded-xl
          text-white
          font-semibold
          shadow-lg
          shadow-orange-500/20
          "
        >
          <Plus size={18} />

          Add Food
        </button>

      </div>

    </div>
  );
}