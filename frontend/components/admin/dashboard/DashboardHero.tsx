"use client";

import {Activity,} from "lucide-react";
type DashboardHeroprops = { adminName: string;
};
export default function DashboardHero({adminName}: DashboardHeroprops) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/20 via-zinc-900 to-zinc-950 p-8">

      {/* Background Glow */}

      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />

      <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-orange-500/10 blur-3xl" />

      <div className="relative">

        {/* Left */}

        <div>

          <p className="text-sm uppercase tracking-[0.3em] text-orange-400">
            CampusVita Enterprise
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            {greeting}, {adminName} 👋
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Welcome back to your enterprise dashboard.
            Monitor orders, revenue, customers,
            inventory and live kitchen activity in one place.
          </p>

          <p className="mt-5 text-sm text-zinc-500">
            {today}
          </p>

        </div>
      </div>

      {/* Bottom Status */}

      <div className="relative mt-10 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-white/10 bg-black/20 px-6 py-5 backdrop-blur-xl">

        <div>

          <p className="text-sm text-zinc-500">
            System Status
          </p>

          <div className="mt-2 flex items-center gap-2">

            <Activity
              size={18}
              className="text-green-400"
            />

            <span className="font-semibold text-green-400">
              All Systems Operational
            </span>

          </div>

        </div>

        <div className="text-right">

          <p className="text-sm text-zinc-500">
            Active Services
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            12 / 12
          </h2>

        </div>

      </div>

    </section>
  );
}