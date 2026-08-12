"use client";

import { useEffect, useState } from "react";

import QRCode from "react-qr-code";

import Navbar from "@/components/layout/Navbar";
import { getImageUrl } from "@/app/lib/getImageUrl";
import { useCart } from "../../context/CartContext";

type Order = {
  items: {
    name: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  total: number;
  status: string;
  date: string;
  token: number;
};

export default function TrackingPage() {

  const { cartItems } = useCart();

  const [latestOrder, setLatestOrder] =
    useState<Order | null>(null);

  useEffect(() => {

    fetch(
      "http://127.0.0.1:8000/orders"
    )
      .then((response) =>
        response.json()
      )
      .then((data) => {

        const lastOrder =
          data.orders[
            data.orders.length - 1
          ];

        setLatestOrder(lastOrder);

      });

  }, []);

  if (!latestOrder) {

    return (

      <main className="min-h-screen bg-black flex items-center justify-center text-white">

        <h1 className="text-4xl font-bold text-orange-500">
          Loading Order...
        </h1>

      </main>

    );

  }

  const totalItems =
    latestOrder.items.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  return (

    <>
      <Navbar/>

      <main className="min-h-screen bg-black text-white p-6 md:p-10">

        <div className="max-w-5xl mx-auto">

          <h1 className="text-5xl font-bold text-orange-500">
            Live Order Tracking
          </h1>

          <p className="text-gray-400 mt-3 text-lg">
            Track your order in real time 🚀
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10">

            <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">

              <div className="flex justify-between items-center">

                <div>

                  <h2 className="text-4xl font-bold">
                    Token
                  </h2>

                  <p className="text-orange-500 text-5xl font-bold mt-4">
                    #{latestOrder.token}
                  </p>

                </div>

                <div className="bg-white p-4 rounded-2xl">

                  <QRCode
                    value={`CampusVita Token ${latestOrder.token}`}
                    size={140}
                  />

                </div>

              </div>

              <div className="mt-10">

                <h3 className="text-2xl font-bold">
                  Order Status
                </h3>

                <div className="mt-6">

                  <div className="w-full h-5 bg-zinc-800 rounded-full overflow-hidden">

                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        latestOrder.status ===
                        "Preparing"
                          ? "w-1/4 bg-yellow-500"
                          : latestOrder.status ===
                            "Cooking"
                          ? "w-2/4 bg-orange-500"
                          : latestOrder.status ===
                            "Ready For Pickup"
                          ? "w-3/4 bg-blue-500"
                          : "w-full bg-green-500"
                      }`}
                    />

                  </div>

                  <p className="mt-4 text-2xl font-bold">

                    {latestOrder.status}

                  </p>

                </div>

              </div>

            </div>

            <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">

              <h2 className="text-3xl font-bold">
                Order Details
              </h2>

              <div className="mt-8 flex flex-col gap-6">

                <div className="flex justify-between text-xl">

                  <p className="text-gray-400">
                    Total Items
                  </p>

                  <p className="font-bold">
                    {totalItems}
                  </p>

                </div>

                <div className="flex justify-between text-xl">

                  <p className="text-gray-400">
                    Total Bill
                  </p>

                  <p className="font-bold text-orange-500">
                    ₹{latestOrder.total}
                  </p>

                </div>

                <div className="flex justify-between text-xl">

                  <p className="text-gray-400">
                    Order Time
                  </p>

                  <p className="font-bold">
                    {latestOrder.date}
                  </p>

                </div>

                <div className="flex justify-between text-xl">

                  <p className="text-gray-400">
                    Estimated Ready
                  </p>

                  <p className="font-bold text-green-400">
                    15-20 mins
                  </p>

                </div>

              </div>

              <div className="mt-10">

                <h3 className="text-2xl font-bold">
                  Ordered Items
                </h3>

                <div className="mt-6 flex flex-col gap-5">

                  {latestOrder.items.map(
                    (item) => (

                      <div
                        key={item.name}
                        className="flex items-center justify-between bg-zinc-800 p-4 rounded-2xl"
                      >

                        <div className="flex items-center gap-4">

                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />

                          <div>

                            <h4 className="text-xl font-bold">
                              {item.name}
                            </h4>

                            <p className="text-gray-400">
                              Qty: {item.quantity}
                            </p>

                          </div>

                        </div>

                        <p className="text-orange-500 text-xl font-bold">
                          ₹
                          {item.price *
                            item.quantity}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </div>

            </div>

          </div>

          {latestOrder.status ===
          "Ready For Pickup" ? (

            <div className="bg-green-500 mt-10 p-6 rounded-3xl text-center">

              <h2 className="text-4xl font-bold text-black">
                Your Order Is Ready For Pickup 🎉
              </h2>

            </div>

          ) : null}

        </div>

      </main>

    </>

  );

}