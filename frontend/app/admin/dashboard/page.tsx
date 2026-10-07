"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  IndianRupee,
  RefreshCw,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

import { getDashboard } from "@/app/lib/api";
import RevenueChart from "@/components/admin/analytics/RevenueChart";
import OrdersChart from "@/components/admin/analytics/OrdersChart";
import SalesPieChart from "@/components/admin/analytics/SalesPieChart";
import TopSellingChart from "@/components/admin/analytics/TopSellingChart";
import RecentOrdersTable from "@/components/admin/dashboard/orders/RecentOrdersTable";

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
      <div className="h-28 rounded-3xl border border-border bg-card" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 rounded-2xl border border-border bg-card"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-[390px] rounded-3xl border border-border bg-card" />
        <div className="h-[390px] rounded-3xl border border-border bg-card" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-[390px] rounded-3xl border border-border bg-card" />
        <div className="h-[390px] rounded-3xl border border-border bg-card" />
      </div>

      <div className="h-[420px] rounded-3xl border border-border bg-card" />
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof IndianRupee;
  iconClass: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-secondary">
            {title}
          </p>

          <p className="mt-3 truncate text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {value}
          </p>

          <p className="mt-2 text-[11px] text-text-muted">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

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
      {/* Dashboard heading */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-colors duration-200 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">
              CampusVita Admin
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-text-secondary">
              Monitor your canteen operations and live order activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary shadow-[var(--shadow-soft)] transition-all duration-200 hover:border-orange-500/40 hover:bg-card-hover hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
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

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          subtitle="Paid orders today"
          icon={IndianRupee}
          iconClass="bg-orange-500/10 text-orange-400"
        />

        <StatCard
          title="Total Orders"
          value={formatNumber(stats.totalOrders)}
          subtitle="All orders"
          icon={ClipboardList}
          iconClass="bg-blue-500/10 text-blue-400"
        />

        <StatCard
          title="Completed Orders"
          value={formatNumber(stats.completedOrders)}
          subtitle={`${completionRate}% of all orders`}
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-400"
        />

        <StatCard
          title="Pending Orders"
          value={formatNumber(stats.pendingOrders)}
          subtitle="Currently in progress"
          icon={Clock3}
          iconClass="bg-violet-500/10 text-violet-400"
        />
      </section>

      {/* Secondary live metrics */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* All-Time Revenue */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:border-orange-500/20 hover:shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
              <TrendingUp size={18} />
            </div>

            <div>
              <p className="text-xs text-text-muted">
                All-Time Revenue
              </p>

              <p className="mt-1 text-lg font-bold text-text-primary">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Peak Ordering Hours */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:border-orange-500/20 hover:shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
              <Clock3 size={18} />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-text-muted">
                Peak Ordering Hours
              </p>

              <p className="mt-1 truncate text-lg font-bold text-text-primary">
                {stats.peakOrderingHours}
              </p>
            </div>
          </div>
        </div>

        {/* Order Activity */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:border-orange-500/20 hover:shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <UtensilsCrossed size={18} />
            </div>

            <div>
              <p className="text-xs text-text-muted">
                Order Activity
              </p>

              <p className="mt-1 text-lg font-bold text-text-primary">
                {stats.totalOrders > 0
                  ? "Active"
                  : "No data"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main analytics */}
      <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0">
          <RevenueChart />
        </div>

        <div className="min-w-0">
          <OrdersChart />
        </div>
      </section>

      {/* Distribution analytics */}
      <section className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="min-w-0">
          <SalesPieChart />
        </div>

        <div className="min-w-0">
          <TopSellingChart />
        </div>
      </section>

      {/* Recent orders */}
      <section className="min-w-0">
        <RecentOrdersTable />
      </section>
    </div>
  );
}