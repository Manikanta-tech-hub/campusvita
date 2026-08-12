"use client";

import { Eye } from "lucide-react";
import StatusBadge from "./StatusBadge";

export interface Order {
  id: string;
  customer: string;
  amount: number;
  items: number;
  status: "Preparing" | "Processing" | "Completed" | "Cancelled";
  time: string;
}

interface Props {
  order: Order;
}

export default function OrderRow({ order }: Props) {
  return (
    <tr className="border-b border-zinc-800 hover:bg-white/[0.02] transition-colors">

      <td className="px-6 py-5">
        <span className="font-semibold text-white">
          #{order.id}
        </span>
      </td>

      <td className="px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
            {order.customer.charAt(0)}
          </div>

          <div>

            <p className="font-medium text-white">
              {order.customer}
            </p>

            <p className="text-sm text-zinc-500">
              {order.items} items
            </p>

          </div>

        </div>

      </td>

      <td className="px-6 py-5 font-semibold text-white">
        ₹{order.amount}
      </td>

      <td className="px-6 py-5 text-zinc-400">
        {order.time}
      </td>

      <td className="px-6 py-5">
        <StatusBadge status={order.status} />
      </td>

      <td className="px-6 py-5 text-right">

        <button
          className="
            rounded-xl
            border
            border-zinc-800
            p-2
            text-zinc-400
            transition
            hover:border-orange-500
            hover:text-orange-500
          "
        >
          <Eye size={18} />
        </button>

      </td>

    </tr>
  );
}