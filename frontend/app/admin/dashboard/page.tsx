"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  IndianRupee,
  RefreshCw,
} from "lucide-react";

import { getDashboard } from "@/app/lib/api";
import RevenueChart from "@/components/admin/analytics/RevenueChart";
import OrdersChart from "@/components/admin/analytics/OrdersChart";
import SalesPieChart from "@/components/admin/analytics/SalesPieChart";
import TopSellingChart from "@/components/admin/analytics/TopSellingChart";
import RecentOrdersTable from "@/components/admin/dashboard/orders/RecentOrdersTable";

/*
  21st.dev "dashboard-with-collapsible-sidebar" layout applied to
  CampusVita:

  - 4 KPI cards (real getDashboard() values)
  - 2/3 chart + 1/3 Quick Stats (real metrics, real derived %)
  - 2/3 recent orders table + 1/3 top selling
  - remaining existing analytics charts

  No placeholder/fake data — every number comes from CampusVita's API.
*/

type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  peakOrderingHours: string;
};

const EMPTY_STATS: DashboardStats = {
  totalOrders: 0,
  totalRevenue: 0,
  todayRevenue: 0,
  pendingOrders: 0,
  completedOrders: 0,
  peakOrderingHours: "No data",
};

function formatCurrency(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-IN");
}

function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="h-5 w-56 rounded-lg border border-border bg-card" />
        <div className="h-10 w-28 rounded-xl border border-border bg-card" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-36 rounded-2xl border border-border bg-card"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-[390px] rounded-3xl border border-border bg-card xl:col-span-2" />
        <div className="h-[390px] rounded-3xl border border-border bg-card" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-[420px] rounded-3xl border border-border bg-card xl:col-span-2" />
        <div className="h-[420px] rounded-3xl border border-border bg-card" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-[390px] rounded-3xl border border-border bg-card" />
        <div className="h-[390px] rounded-3xl border border-border bg-card" />
      </div>
    </div>
  );
}

/* ============================================================
   KPI CARD — 21st.dev card language, CampusVita orange accent
============================================================ */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof IndianRupee;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[var(--shadow-card)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors duration-200 group-hover:bg-brand group-hover:text-white!">
        <Icon size={20} />
      </span>

      <p className="mt-4 text-sm font-medium text-text-secondary!">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-text-primary! sm:text-3xl">
        {value}
      </p>

      <p className="mt-1.5 text-xs text-text-muted!">
        {subtitle}
      </p>
    </div>
  );
}

/* ============================================================
   QUICK STATS — real CampusVita metrics + derived percentages
============================================================ */

function QuickStatsRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-text-secondary">
        {label}
      </span>

      <span className="text-sm font-bold text-text-primary">
        {value}
      </span>
    </div>
  );
}

function QuickStatsBarRow({
  label,
  value,
  percent,
}: {
  label: string;
  value: string;
  percent: number;
}) {
  const safePercent = Math.max(
    0,
    Math.min(100, Number(percent) || 0)
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-text-secondary">
          {label}
        </span>

        <span className="text-sm font-bold text-text-primary">
          {value}
        </span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand to-red-500 transition-all duration-500"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

function QuickStatsPanel({
  stats,
  completionRate,
}: {
  stats: DashboardStats;
  completionRate: number;
}) {
  const pendingShare =
    stats.totalOrders > 0
      ? Math.round(
          (stats.pendingOrders / stats.totalOrders) * 100
        )
      : 0;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-colors duration-200">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          Quick Stats
        </h2>

        <p className="mt-1 text-sm">
          Live operational snapshot
        </p>
      </div>

      <div className="space-y-5">
        <QuickStatsRow
          label="All-Time Revenue"
          value={formatCurrency(stats.totalRevenue)}
        />

        <QuickStatsBarRow
          label="Completion Rate"
          value={`${completionRate}%`}
          percent={completionRate}
        />

        <QuickStatsBarRow
          label="Pending Share"
          value={`${formatNumber(stats.pendingOrders)} orders`}
          percent={pendingShare}
        />

        <QuickStatsRow
          label="Peak Ordering Hours"
          value={stats.peakOrderingHours}
        />

        <QuickStatsRow
          label="Order Activity"
          value={stats.totalOrders > 0 ? "Active" : "No data"}
        />
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD PAGE
============================================================ */

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setError("");

      const data = await getDashboard();

      setStats({
        totalOrders: Number(data?.total_orders ?? 0),
        totalRevenue: Number(data?.total_revenue ?? 0),
        todayRevenue: Number(data?.today_revenue ?? 0),
        pendingOrders: Number(data?.pending_orders ?? 0),
        completedOrders: Number(data?.completed_orders ?? 0),
        peakOrderingHours:
          data?.peak_ordering_hours || "No data",
      });
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    const interval = window.setInterval(() => {
      void loadDashboard();
    }, 10000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  const completionRate = useMemo(() => {
    if (!stats.totalOrders) return 0;

    return Math.round(
      (stats.completedOrders / stats.totalOrders) * 100
    );
  }, [stats.completedOrders, stats.totalOrders]);

  if (loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Live status + manual refresh */}

      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-text-muted!">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          Live — auto-refreshes every 10 seconds
        </p>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-all duration-200 hover:border-brand/40 hover:bg-card-hover hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      {/* Error state */}
      {error && (
        <section className="rounded-2xl border border-danger/20 bg-danger-soft p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-danger"
              />

              <div>
                <p className="text-sm font-semibold text-danger">
                  Unable to load dashboard data
                </p>

                <p className="mt-1 text-xs text-danger/80">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-danger/20 px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/10"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        </section>
      )}

      {/* KPI cards — 4 real metrics from getDashboard() */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          subtitle="Paid orders today"
          icon={IndianRupee}
        />

        <StatCard
          title="Total Orders"
          value={formatNumber(stats.totalOrders)}
          subtitle="All orders"
          icon={ClipboardList}
        />

        <StatCard
          title="Completed Orders"
          value={formatNumber(stats.completedOrders)}
          subtitle={`${completionRate}% of all orders`}
          icon={CheckCircle2}
        />

        <StatCard
          title="Pending Orders"
          value={formatNumber(stats.pendingOrders)}
          subtitle="Currently in progress"
          icon={Clock3}
        />
      </section>

      {/* Chart (2/3) + Quick Stats (1/3) */}

      <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RevenueChart />
        </div>

        <div className="min-w-0">
          <QuickStatsPanel
            stats={stats}
            completionRate={completionRate}
          />
        </div>
      </section>

      {/* Recent orders table (2/3) + Top selling (1/3) */}

      <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <RecentOrdersTable />
        </div>

        <div className="min-w-0">
          <TopSellingChart />
        </div>
      </section>

      {/* Existing distribution analytics */}

      <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0">
          <OrdersChart />
        </div>

        <div className="min-w-0">
          <SalesPieChart />
        </div>
      </section>
    </div>
  );
}
