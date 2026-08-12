"use client";

import { ArrowRight } from "lucide-react";

const orders = [
  {
    id: "#02341",
    customer: "Rahul Kumar",
    avatar: "R",
    amount: "₹470",
    time: "2 min ago",
    status: "Preparing",
  },
  {
    id: "#02340",
    customer: "Sneha Patel",
    avatar: "S",
    amount: "₹280",
    time: "8 min ago",
    status: "Completed",
  },
  {
    id: "#02339",
    customer: "Arjun Singh",
    avatar: "A",
    amount: "₹550",
    time: "15 min ago",
    status: "Processing",
  },
  {
    id: "#02338",
    customer: "Priya Sharma",
    avatar: "P",
    amount: "₹320",
    time: "22 min ago",
    status: "Preparing",
  },
  {
    id: "#02337",
    customer: "Aman Verma",
    avatar: "A",
    amount: "₹190",
    time: "35 min ago",
    status: "Completed",
  },
];

const statusStyles = {
  Preparing:
    "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",

  Completed:
    "bg-green-500/15 text-green-400 border border-green-500/20",

  Processing:
    "bg-blue-500/15 text-blue-400 border border-blue-500/20",
};

export default function RecentOrders() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-[#17171f] p-6">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <div>

          <h2 className="text-2xl font-semibold text-white">
            Recent Orders
          </h2>

          <p className="text-sm text-zinc-500 mt-1">
            Latest customer orders
          </p>

        </div>

        <button
          className="
          flex items-center gap-2
          text-orange-500
          hover:text-orange-400
          transition
          "
        >
          View All

          <ArrowRight size={18} />

        </button>

      </div>

      {/* Table */}

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead>

            <tr className="border-b border-zinc-800 text-zinc-500 text-sm">

              <th className="text-left py-3 font-medium">
                Order
              </th>

              <th className="text-left py-3 font-medium">
                Customer
              </th>

              <th className="text-left py-3 font-medium">
                Amount
              </th>

              <th className="text-left py-3 font-medium">
                Time
              </th>

              <th className="text-right py-3 font-medium">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {orders.map((order) => (

              <tr
                key={order.id}
                className="
                border-b border-zinc-900
                hover:bg-zinc-900/40
                transition
                "
              >

                <td className="py-5">

                  <span className="font-semibold text-white">
                    {order.id}
                  </span>

                </td>

                <td className="py-5">

                  <div className="flex items-center gap-3">

                    <div
                      className="
                      w-10
                      h-10
                      rounded-full
                      bg-orange-500
                      flex
                      items-center
                      justify-center
                      text-white
                      font-bold
                      "
                    >
                      {order.avatar}
                    </div>

                    <span className="text-white">
                      {order.customer}
                    </span>

                  </div>

                </td>

                <td className="py-5 font-semibold text-white">
                  {order.amount}
                </td>

                <td className="py-5 text-zinc-400">
                  {order.time}
                </td>

                <td className="py-5 text-right">

                  <span
                    className={`
                      px-3
                      py-1.5
                      rounded-full
                      text-xs
                      font-semibold
                      ${
                        statusStyles[
                          order.status as keyof typeof statusStyles
                        ]
                      }
                    `}
                  >
                    {order.status}
                  </span>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}