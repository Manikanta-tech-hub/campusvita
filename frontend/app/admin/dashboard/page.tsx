"use client";

import { useState, useEffect } from "react";

import DashboardSkeleton from "@/components/admin/dashboard/skeleton/DashboardSkeleton";
import AnalyticsGrid from "@/components/admin/analytics/AnalyticsGrid";

import { getDashboard } from "../../lib/api";

import BusinessInsights from "@/components/admin/dashboard/BusinessInsights";
import HeroSection from "@/components/admin/dashboard/HeroSection";

import TopSellingChart from "@/components/admin/analytics/TopSellingChart";
import RevenueChart from "@/components/admin/analytics/RevenueChart";

import RecentOrdersTable from "@/components/admin/dashboard/orders/RecentOrdersTable";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    peakOrderingHours: "No data",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboard();

        console.log("Dashboard API response:", data);

        setStats({
          totalOrders: data.total_orders ?? 0,
          totalRevenue: data.total_revenue ?? 0,
          todayRevenue: data.today_revenue ?? 0,
          pendingOrders: data.pending_orders ?? 0,
          completedOrders: data.completed_orders ?? 0,
          peakOrderingHours:

    data.peak_ordering_hours ?? "No data",
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">

      {/* ================= HERO ================= */}
      <HeroSection
        adminName="Manikanta"
        revenue={stats.totalRevenue}
        totalOrders={stats.totalOrders}
        pendingOrders={stats.pendingOrders}
      />

      {/* ================= BUSINESS INSIGHTS ================= */}
      <div className="mt-8">
      <BusinessInsights
  revenue={stats.totalRevenue}
  todayRevenue={stats.todayRevenue}
  totalOrders={stats.totalOrders}
completedOrders={stats.completedOrders}
pendingOrders={stats.pendingOrders}
peakOrderingHours={stats.peakOrderingHours}
/>
      </div>
      {/* ================= ANALYTICS ================= */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        <div className="h-full">
          <TopSellingChart />
        </div>

        <div className="h-full">
          <RevenueChart />
        </div>

      </div>

      {/* ================= ANALYTICS GRID ================= */}
      <div className="mt-8">
        <AnalyticsGrid />
      </div>

      {/* ================= RECENT ORDERS + LIVE ACTIVITY ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">

        <div className="xl:col-span-2">
          <RecentOrdersTable />
        </div>

      </div>

    </div>
  );
}