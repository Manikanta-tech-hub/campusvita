"use client";

import {
  Layers3,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
} from "lucide-react";

type Props = {
  stats: {
    total_categories: number;
    active_categories: number;
    inactive_categories: number;
    total_foods: number;
  };
};

export default function CategoryStats({
  stats,
}: Props) {

  const items = [
    {
      title: "Total Categories",
      value: stats.total_categories,
      subtitle: "Database records",
      icon: Layers3,
      bg: "bg-orange-500/15",
      color: "text-orange-400",
    },
    {
      title: "Active Categories",
      value: stats.active_categories,
      subtitle: "Currently active",
      icon: CheckCircle2,
      bg: "bg-green-500/15",
      color: "text-green-400",
    },
    {
      title: "Inactive Categories",
      value: stats.inactive_categories,
      subtitle: "Currently inactive",
      icon: XCircle,
      bg: "bg-red-500/15",
      color: "text-red-400",
    },
    {
      title: "Total Foods",
      value: stats.total_foods,
      subtitle: "Food records",
      icon: UtensilsCrossed,
      bg: "bg-violet-500/15",
      color: "text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

      {items.map((item) => {

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
              transition
            "
          >

            <div
              className={`
                w-14
                h-14
                rounded-xl
                flex
                items-center
                justify-center
                ${item.bg}
              `}
            >
              <Icon
                size={26}
                className={item.color}
              />
            </div>

            <h3 className="text-4xl font-bold text-white mt-6">
              {item.value}
            </h3>

            <p className="text-zinc-300 font-medium mt-2">
              {item.title}
            </p>

            <p className="text-sm text-zinc-500 mt-1">
              {item.subtitle}
            </p>

          </div>
        );
      })}

    </div>
  );
}