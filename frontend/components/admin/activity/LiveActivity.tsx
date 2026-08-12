"use client";

import { motion } from "framer-motion";
import {
  ShoppingBag,
  UserPlus,
  ChefHat,
  Pencil,
  CheckCircle2,
} from "lucide-react";

const activities = [
  {
    id: 1,
    title: "New Order",
    subtitle: "Order #1024 has been placed",
    time: "2 min ago",
    icon: ShoppingBag,
    color: "text-blue-400",
  },
  {
    id: 2,
    title: "New Customer",
    subtitle: "A new customer registered",
    time: "5 min ago",
    icon: UserPlus,
    color: "text-green-400",
  },
  {
    id: 3,
    title: "Food Added",
    subtitle: "Chicken Biryani was added",
    time: "12 min ago",
    icon: ChefHat,
    color: "text-orange-400",
  },
  {
    id: 4,
    title: "Food Updated",
    subtitle: "Paneer Butter Masala was updated",
    time: "18 min ago",
    icon: Pencil,
    color: "text-purple-400",
  },
  {
    id: 5,
    title: "Order Completed",
    subtitle: "Order #1018 was completed",
    time: "25 min ago",
    icon: CheckCircle2,
    color: "text-emerald-400",
  },
];

export default function LiveActivity() {
  return (
    <div className="h-full rounded-3xl border border-zinc-800 bg-[#17171f] p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Live Activity
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Latest system events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />

          <span className="text-xs text-green-400">
            LIVE
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.05,
              }}
              className="flex gap-4"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 ${activity.color}`}
              >
                <Icon size={18} />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-white">
                    {activity.title}
                  </h3>

                  <span className="whitespace-nowrap text-xs text-zinc-500">
                    {activity.time}
                  </span>
                </div>

                <p className="mt-1 text-sm text-zinc-400">
                  {activity.subtitle}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}