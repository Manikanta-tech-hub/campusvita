"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  ShoppingBag,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Phone,
  CalendarDays,
  X,
} from "lucide-react";

import { getCustomers } from "@/app/lib/api";

type RecentOrder = {
  order_id: string;
  token?: string;
  amount: number;
  status: string;
  date?: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile_image?: string;
  department?: string;
  year?: string;
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_spent: number;
  total_payments: number;
  status: string;
  joined_at?: string;
  recent_orders?: RecentOrder[];
};

type Statistics = {
  total_customers: number;
  active_customers: number;
  new_customers: number;
  customers_with_orders: number;
  total_orders: number;
  total_spent: number;
  total_payments: number;
};

type CustomersResponse = {
  customers?: Customer[];
  statistics?: Statistics;
  pages?: number;
  page?: number;
  limit?: number;
  total?: number;
};

const emptyStats: Statistics = {
  total_customers: 0,
  active_customers: 0,
  new_customers: 0,
  customers_with_orders: 0,
  total_orders: 0,
  total_spent: 0,
  total_payments: 0,
};

function formatMoney(value: number | undefined) {
  return `₹${Number(value ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name?: string) {
  if (!name?.trim()) return "CU";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function CustomerManagementPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [statistics, setStatistics] =
    useState<Statistics>(emptyStats);

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState("LATEST");

  const [page, setPage] = useState(1);
  const limit = 6;

  const [totalPages, setTotalPages] = useState(0);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      /*
       * getCustomers must accept:
       * page, limit, search, status, sort
       */
      const data = (await getCustomers(
        page,
        limit,
        search,
        status,
        sort
      )) as CustomersResponse;

      console.log("Customers API response:", data);

      setCustomers(data?.customers ?? []);

      setStatistics(
        data?.statistics ?? emptyStats
      );

      setTotalPages(
        Number(data?.pages ?? 0)
      );

      if (selectedCustomer) {
        const updatedCustomer =
          data?.customers?.find(
            (customer) =>
              customer.id === selectedCustomer.id
          );

        if (updatedCustomer) {
          setSelectedCustomer(updatedCustomer);
        }
      }
    } catch (err) {
      console.error(
        "Customer Management error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, sort]);

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatus(value: string) {
    setStatus(value);
    setPage(1);
  }

  function handleSort(value: string) {
    setSort(value);
    setPage(1);
  }

  function handleCustomerClick(
    customer: Customer
  ) {
    setSelectedCustomer(customer);
    setOpenMenu(null);
  }

  function exportCustomers() {
    if (!customers.length) return;

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Orders",
      "Total Spent",
      "Status",
      "Joined Date",
    ];

    const rows = customers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone,
      customer.total_orders,
      customer.total_spent,
      customer.status,
      formatDate(customer.joined_at),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "campusvita-customers.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-full space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Customer Management
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-zinc-500">
              Dashboard
            </span>

            <span className="text-zinc-700">
              /
            </span>

            <span className="text-orange-400">
              Customer Management
            </span>
          </div>
        </div>

        <div className="relative w-full xl:w-80">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
          />

          <input
            value={search}
            onChange={(e) =>
              handleSearch(e.target.value)
            }
            placeholder="Search customers..."
            className="h-12 w-full rounded-2xl border border-zinc-800 bg-[#11151d] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500/60"
          />
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={statistics.total_customers}
          icon={Users}
          iconClass="bg-purple-500/20 text-purple-300"
        />

        <StatCard
          title="Active Customers"
          value={statistics.active_customers}
          icon={UserCheck}
          iconClass="bg-emerald-500/20 text-emerald-300"
        />

        <StatCard
          title="New Customers"
          value={statistics.new_customers}
          icon={UserPlus}
          iconClass="bg-blue-500/20 text-blue-300"
        />

        <StatCard
          title="Customers With Orders"
          value={
            statistics.customers_with_orders
          }
          icon={ShoppingBag}
          iconClass="bg-orange-500/20 text-orange-300"
        />
      </div>

      {/* MAIN CONTENT */}

      <div
        className={`grid gap-5 ${
          selectedCustomer
            ? "xl:grid-cols-[minmax(0,1fr)_390px]"
            : "grid-cols-1"
        }`}
      >
        {/* CUSTOMER TABLE */}

        <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-[#11151d]">
          <div className="border-b border-zinc-800 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  All Customers
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  Real customer accounts from
                  CampusVita
                </p>
              </div>

              <button
                type="button"
                onClick={exportCustomers}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                <Download size={16} />
                Export
              </button>
            </div>

            {/* FILTERS */}

            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
                />

                <input
                  value={search}
                  onChange={(e) =>
                    handleSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search by name, email or phone..."
                  className="h-11 w-full rounded-xl border border-zinc-800 bg-[#0c1017] pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-orange-500/50"
                />
              </div>

              <select
                value={status}
                onChange={(e) =>
                  handleStatus(e.target.value)
                }
                className="h-11 rounded-xl border border-zinc-800 bg-[#0c1017] px-4 text-sm text-zinc-300 outline-none focus:border-orange-500/50"
              >
                <option value="ALL">
                  All Status
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              <select
                value={sort}
                onChange={(e) =>
                  handleSort(e.target.value)
                }
                className="h-11 rounded-xl border border-zinc-800 bg-[#0c1017] px-4 text-sm text-zinc-300 outline-none focus:border-orange-500/50"
              >
                <option value="LATEST">
                  Newest
                </option>

                <option value="NAME_ASC">
                  Name A-Z
                </option>

                <option value="NAME_DESC">
                  Name Z-A
                </option>

                <option value="SPENDING_HIGH">
                  Spending High
                </option>

                <option value="SPENDING_LOW">
                  Spending Low
                </option>

                <option value="ORDERS_HIGH">
                  Orders High
                </option>
              </select>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-[#151a23] text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-4 py-4">
                    Email
                  </th>

                  <th className="px-4 py-4">
                    Phone
                  </th>

                  <th className="px-4 py-4">
                    Orders
                  </th>

                  <th className="px-4 py-4">
                    Total Spent
                  </th>

                  <th className="px-4 py-4">
                    Status
                  </th>

                  <th className="px-4 py-4">
                    Joined Date
                  </th>

                  <th className="px-4 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-zinc-500"
                    >
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center text-zinc-500"
                    >
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() =>
                        handleCustomerClick(
                          customer
                        )
                      }
                      className="cursor-pointer border-b border-zinc-800/70 transition hover:bg-white/[0.025]"
                    >
                      {/* CUSTOMER */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {customer.profile_image ? (
                            <img
                              src={
                                customer.profile_image
                              }
                              alt={
                                customer.name ||
                                "Customer"
                              }
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/15 text-sm font-semibold text-orange-300">
                              {getInitials(
                                customer.name
                              )}
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">
                              {customer.name ||
                                "Unnamed Customer"}
                            </p>

                            <p className="text-xs text-zinc-600">
                              Customer
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}

                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {customer.email || "—"}
                      </td>

                      {/* PHONE */}

                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {customer.phone || "—"}
                      </td>

                      {/* ORDERS */}

                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {customer.total_orders ?? 0}
                      </td>

                      {/* SPENT */}

                      <td className="px-4 py-4 text-sm font-medium text-white">
                        {formatMoney(
                          customer.total_spent
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            customer.status?.toUpperCase() ===
                            "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {customer.status ||
                            "UNKNOWN"}
                        </span>
                      </td>

                      {/* DATE */}

                      <td className="px-4 py-4 text-sm text-zinc-400">
                        {formatDate(
                          customer.joined_at
                        )}
                      </td>

                      {/* ACTION */}

                      <td
                        className="relative px-4 py-4 text-right"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu ===
                                customer.id
                                ? null
                                : customer.id
                            )
                          }
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
                        >
                          <MoreVertical
                            size={18}
                          />
                        </button>

                        {openMenu ===
                          customer.id && (
                          <div className="absolute right-4 top-12 z-20 w-40 rounded-xl border border-zinc-700 bg-[#181c25] p-1 shadow-2xl">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomer(
                                  customer
                                );
                                setOpenMenu(null);
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
                            >
                              View Details
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          <div className="flex flex-col gap-4 border-t border-zinc-800 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              Showing{" "}
              <span className="text-zinc-300">
                {customers.length}
              </span>{" "}
              of{" "}
              <span className="text-zinc-300">
                {statistics.total_customers}
              </span>{" "}
              customers
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                  )
                }
                className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white">
                {page}
              </span>

              <span className="px-1 text-sm text-zinc-600">
                of
              </span>

              <span className="text-sm text-zinc-400">
                {totalPages || 1}
              </span>

              <button
                type="button"
                disabled={
                  totalPages === 0 ||
                  page >= totalPages
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                  )
                }
                className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>

        {/* CUSTOMER DETAILS */}

        {selectedCustomer && (
          <aside className="h-fit overflow-hidden rounded-2xl border border-zinc-800 bg-[#11151d]">
            <div className="flex items-center justify-between border-b border-zinc-800 p-5">
              <h2 className="text-lg font-semibold text-white">
                Customer Details
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedCustomer(null)
                }
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {/* PROFILE */}

              <div className="flex items-center gap-4">
                {selectedCustomer.profile_image ? (
                  <img
                    src={
                      selectedCustomer.profile_image
                    }
                    alt={
                      selectedCustomer.name ||
                      "Customer"
                    }
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-orange-500/15 text-2xl font-bold text-orange-300">
                    {getInitials(
                      selectedCustomer.name
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-lg font-semibold text-white">
                      {selectedCustomer.name ||
                        "Unnamed Customer"}
                    </h3>

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-medium ${
                        selectedCustomer.status?.toUpperCase() ===
                        "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {selectedCustomer.status ||
                        "UNKNOWN"}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />

                      <span className="truncate">
                        {selectedCustomer.email ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone size={14} />

                      <span>
                        {selectedCustomer.phone ||
                          "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <CalendarDays
                        size={14}
                      />

                      <span>
                        Joined{" "}
                        {formatDate(
                          selectedCustomer.joined_at
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS */}

              <div className="mt-6 grid grid-cols-3 divide-x divide-zinc-800 rounded-xl border border-zinc-800 bg-[#0c1017]">
                <MiniStat
                  label="Orders"
                  value={
                    selectedCustomer.total_orders ??
                    0
                  }
                />

                <MiniStat
                  label="Spent"
                  value={formatMoney(
                    selectedCustomer.total_spent
                  )}
                />

                <MiniStat
                  label="Payments"
                  value={
                    selectedCustomer.total_payments ??
                    0
                  }
                />
              </div>

              {/* RECENT ORDERS */}

              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-white">
                    Recent Orders
                  </h3>

                  <span className="text-xs text-zinc-600">
                    Latest 5
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedCustomer.recent_orders
                    ?.length ? (
                    selectedCustomer.recent_orders.map(
                      (order, index) => (
                        <div
                          key={`${order.order_id}-${index}`}
                          className="rounded-xl border border-zinc-800 bg-[#0c1017] p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-white">
                                #
                                {order.order_id ||
                                  order.token ||
                                  "Order"}
                              </p>

                              <p className="mt-1 text-xs text-zinc-600">
                                {formatDate(
                                  order.date
                                )}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-medium text-white">
                                {formatMoney(
                                  order.amount
                                )}
                              </p>

                              <span
                                className={`mt-1 inline-block text-[10px] ${
                                  order.status
                                    ?.toLowerCase()
                                    .includes(
                                      "complete"
                                    ) ||
                                  order.status
                                    ?.toLowerCase()
                                    .includes(
                                      "deliver"
                                    )
                                    ? "text-emerald-400"
                                    : "text-orange-400"
                                }`}
                              >
                                {order.status ||
                                  "—"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="rounded-xl border border-zinc-800 bg-[#0c1017] p-6 text-center text-sm text-zinc-600">
                      No orders found.
                    </div>
                  )}
                </div>
              </div>

              {/* FULL PROFILE */}

              <button
                type="button"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
              >
                <Users size={17} />
                View Full Profile
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#11151d] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {Number(value ?? 0).toLocaleString(
              "en-IN"
            )}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MINI STAT
============================================================ */

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-3 text-center">
      <p className="text-sm font-semibold text-white">
        {value}
      </p>

      <p className="mt-1 text-[10px] text-zinc-600">
        {label}
      </p>
    </div>
  );
}