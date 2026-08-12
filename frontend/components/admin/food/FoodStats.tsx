"use client";

import {
  UtensilsCrossed,
  BadgeCheck,
  PackageX,
  Layers3,
} from "lucide-react";

type Food = {
  name: string;
  category: string;
  available: boolean;
};

type Props = {
  foods: Food[];
};

export default function FoodStats({ foods }: Props) {
  const totalFoods = foods.length;

  const availableFoods = foods.filter(
    (food) => food.available
  ).length;

  const outOfStock = foods.filter(
    (food) => !food.available
  ).length;

  const categories = new Set(
    foods.map((food) => food.category)
  ).size;

  const stats = [
    {
      title: "Total Foods",
      value: totalFoods,
      subtitle: `${totalFoods} items`,
      icon: UtensilsCrossed,
      iconBg: "bg-orange-500/15",
      iconColor: "text-orange-400",
    },
    {
      title: "Available",
      value: availableFoods,
      subtitle:
        totalFoods
          ? `${Math.round(
              (availableFoods / totalFoods) * 100
            )}% available`
          : "No foods",
      icon: BadgeCheck,
      iconBg: "bg-green-500/15",
      iconColor: "text-green-400",
    },
    {
      title: "Out of Stock",
      value: outOfStock,
      subtitle:
        outOfStock > 0
          ? "Needs attention"
          : "Everything available",
      icon: PackageX,
      iconBg: "bg-red-500/15",
      iconColor: "text-red-400",
    },
    {
      title: "Categories",
      value: categories,
      subtitle: "Food groups",
      icon: Layers3,
      iconBg: "bg-violet-500/15",
      iconColor: "text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {stats.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="
              bg-zinc-900
              border
              border-zinc-800
              rounded-2xl
              p-6
              hover:border-orange-500/40
              transition-all
              duration-300
            "
          >
            <div className="flex items-center justify-between mb-6">
              <div
                className={`
                  w-14
                  h-14
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  ${item.iconBg}
                `}
              >
                <Icon
                  className={item.iconColor}
                  size={26}
                />
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white">
              {item.value}
            </h2>

            <p className="mt-2 text-zinc-300 font-medium">
              {item.title}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {item.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}