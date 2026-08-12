"use client";

import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:8000";

interface Order {
  order_id: string;
  token: number;
  name?: string;
  email?: string;
  total: number;
  status: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      const token = localStorage.getItem("access_token");

      const res = await fetch(`${API_URL}/admin/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      console.log("Orders API:", data);

      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <h2 className="p-6 text-white">Loading orders...</h2>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">Orders</h1>

      <table className="w-full border border-zinc-700">
        <thead className="bg-zinc-800">
          <tr>
            <th className="p-3">Token</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Email</th>
            <th className="p-3">Total</th>
            <th className="p-3">Status</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.order_id} className="border-t border-zinc-700">
              <td className="p-3">{order.token}</td>
              <td className="p-3">{order.name}</td>
              <td className="p-3">{order.email}</td>
              <td className="p-3">₹{order.total}</td>
              <td className="p-3">{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}