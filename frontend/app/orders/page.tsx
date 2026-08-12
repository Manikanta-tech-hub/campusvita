"use client";

import toast from "react-hot-toast";

import {
  useEffect,
  useState,
} from "react";

import {
  MoreVertical,
  Trash2,
  Share2,
  X,
  Star,
  PackageCheck,
  Clock3,
} from "lucide-react";
import { getImageUrl } from "@/app/lib/getImageUrl";
import { io } from "socket.io-client";

import Navbar from "@/components/layout/Navbar";

import { useCart } from "../../context/CartContext";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  image: string;
};

type Order = {
  order_id: string;
  items: OrderItem[];
  total: number;
  status: string;
  date: string;
  token: number;
  pickup_code: number;
  estimated_time: string;
};

export default function OrdersPage() {

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedOrder, setSelectedOrder] =
    useState<number | null>(null);

  const [showRatingModal, setShowRatingModal] =
    useState(false);

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [feedback, setFeedback] =
    useState("");

  const [selectedFoodName, setSelectedFoodName] =
    useState("");

  const { cartItems, addToCart } =
    useCart();

  // =====================================
  // FETCH ORDERS
  // =====================================

  const fetchOrders = async () => {

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/orders/${localStorage.getItem("userEmail")}`
      );

      const data =
        await response.json();

      if (data.orders) {

        setOrders(
          data.orders.reverse()
        );

      }

    } catch (error) {

      console.log(error);

      toast.error(
        "Failed To Load Orders"
      );

    } finally {

      setLoading(false);

    }

  };

  // =====================================
  // SOCKET LIVE UPDATE
  // =====================================
  useEffect(() => {

    fetchOrders();
  
    const socket = io("http://127.0.0.1:8000");
  
    socket.on("order_update", fetchOrders);
  
    return () => {
      socket.disconnect();
    };
  
  }, []);
  // =====================================
  // REORDER
  // =====================================

  const handleReorder = (
    items: OrderItem[]
  ) => {

    items.forEach((item) => {

      addToCart({
        name: item.name,
        price: item.price,
        image: item.image,
    });

    });

    toast.success(
      "Items Added To Cart 🚀"
    );

  };

  // =====================================
// DELETE ORDER
// =====================================

const handleDeleteOrder = async (orderId: string) => {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/delete-order/${orderId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.message);
      return;
    }

    toast.success(data.message);

    fetchOrders();

    setSelectedOrder(null);

  } catch (error) {
    console.log(error);

    toast.error("Failed To Delete Order");
  }
};
  // =====================================
  // SHARE ORDER
  // =====================================

  const handleShareOrder = (
    order: Order
  ) => {

    const text = `
CampusVita Order 🚀

Token: #${order.token}

Items:
${order.items
  .map(
    (item) =>
      `${item.name} x ${item.quantity}`
  )
  .join("\n")}

Total: ₹${order.total}
`;

if (navigator.share) {
  navigator.share({
    title: "CampusVita Order",
    text,
  });
} else {
  navigator.clipboard.writeText(text);
  toast.success("Order copied to clipboard");
}

  };

  // =====================================
  // RATE ORDER
  // =====================================

  const handleRateOrder =
    async () => {

      if (selectedRating === 0) {

        toast.error(
          "Please Select Rating ⭐"
        );

        return;

      }

      try {

        const response = await fetch(
          "http://127.0.0.1:8000/rate-order",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              food_name:
                selectedFoodName,
              rating:
                selectedRating,
              feedback,
            }),
          }
        );

        const data =
          await response.json();

        toast.success(
          data.message
        );

        setShowRatingModal(false);

        setSelectedRating(0);

        setFeedback("");

      } catch (error) {

        console.log(error);

        toast.error(
          "Failed To Submit Rating"
        );

      }

    };

  // =====================================
  // STATUS COLORS
  // =====================================

  const getStatusColor = (
    status: string
  ) => {

    switch (status) {

      case "Preparing":

        return "bg-yellow-500/20 text-yellow-400 border-yellow-500";

      case "Cooking":

        return "bg-orange-500/20 text-orange-400 border-orange-500";

      case "Ready For Pickup":

        return "bg-blue-500/20 text-blue-400 border-blue-500";

      case "Completed":

        return "bg-green-500/20 text-green-400 border-green-500";

      default:

        return "bg-zinc-700 text-white border-zinc-700";

    }

  };

  return (

    <>
      <Navbar/>

      <main className="min-h-screen bg-black text-white p-6 md:p-10">

        <div className="max-w-6xl mx-auto">

          <h1 className="text-5xl font-bold text-orange-500">

            Order History

          </h1>

          <p className="text-gray-400 mt-3 text-lg">

            Track all your orders 🚀

          </p>

          {/* LOADING */}

          {loading ? (

            <div className="mt-20">

              <p className="text-xl text-gray-400">

                Loading Orders...

              </p>

            </div>

          ) : orders.length === 0 ? (

            <div className="bg-zinc-900 p-10 rounded-3xl mt-10 text-center border border-zinc-800">

              <h2 className="text-3xl font-bold">

                No Orders Yet 🍔

              </h2>

            </div>

          ) : (

            <div className="mt-10 flex flex-col gap-8">

              {orders.map(
                (order, index) => (

                  <div
                    key={index}
                    className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8"
                  >

                    {/* HEADER */}

                    <div className="flex flex-col lg:flex-row justify-between gap-6">

                      <div>

                        <div className="flex items-center gap-3">

                          <PackageCheck
                            className="text-orange-500"
                          />

                          <h2 className="text-4xl font-bold">

                            Token #{order.token}

                          </h2>

                        </div>

                        <div className="mt-4 flex flex-col gap-2 text-gray-400">

                          <p className="flex items-center gap-2">

                            <Clock3 size={18} />

                            {order.date}

                          </p>

                          <p>

                            Pickup Code:
                            {" "}
                            <span className="text-green-400 font-bold">

                              {order.pickup_code}

                            </span>

                          </p>

                          <p>

                            ETA:
                            {" "}
                            {order.estimated_time}

                          </p>

                        </div>

                      </div>

                      <div className="flex items-center gap-4">

                        <div
                          className={`px-5 py-3 rounded-2xl border font-bold ${getStatusColor(
                            order.status
                          )}`}
                        >

                          {order.status}

                        </div>

                        <button
                          onClick={() =>
                            setSelectedOrder(index)
                          }
                        >

                          <MoreVertical />

                        </button>

                      </div>

                    </div>

                    {/* ITEMS */}

                    <div className="mt-8 flex flex-col gap-5">

                      {order.items.map(
                        (item) => (

                          <div
                            key={item.name}
                            className="bg-zinc-800 rounded-3xl p-5 flex justify-between items-center"
                          >

                            <div className="flex items-center gap-5">

                              <img
                                src={getImageUrl(item.image)}
                                alt={item.name}
                                className="w-24 h-24 object-cover rounded-2xl"
                              />

                              <div>

                                <h3 className="text-2xl font-bold">

                                  {item.name}

                                </h3>

                                <p className="text-gray-400 mt-1">

                                  Quantity:
                                  {" "}
                                  {item.quantity}

                                </p>

                              </div>

                            </div>

                            <h3 className="text-2xl font-bold text-orange-500">

                              ₹
                              {item.price *
                                item.quantity}

                            </h3>

                          </div>

                        )
                      )}

                    </div>

                    {/* FOOTER */}

                    <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-5">

                      <h2 className="text-4xl font-bold text-orange-500">

                        ₹{order.total}

                      </h2>

                      <div className="flex gap-4 flex-wrap">

                        <button
                          onClick={() =>
                            handleReorder(
                              order.items
                            )
                          }
                          className="bg-green-500 px-6 py-3 rounded-2xl hover:bg-green-600 transition-all font-semibold"
                        >

                          Reorder

                        </button>

                        <button
                          onClick={() => {

                            setShowRatingModal(
                              true
                            );

                            setSelectedFoodName(
                              order.items[0].name
                            );

                          }}
                          className="bg-orange-500 px-6 py-3 rounded-2xl hover:bg-orange-600 transition-all font-semibold"
                        >

                          Rate Order

                        </button>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </main>

      {/* OPTIONS MODAL */}

      {selectedOrder !== null && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-zinc-900 p-8 rounded-3xl w-full max-w-md border border-zinc-800">

            <div className="flex justify-between items-center">

              <h2 className="text-3xl font-bold">

                Order Options

              </h2>

              <button
                onClick={() =>
                  setSelectedOrder(null)
                }
              >

                <X />

              </button>

            </div>

            <div className="mt-8 flex flex-col gap-6">

              <button
                onClick={() =>
                  selectedOrder !== null &&
                  handleDeleteOrder(
                    orders[selectedOrder].order_id
                  )
                }
                className="flex items-center gap-4 text-red-400 text-xl"
              >

                <Trash2 />

                Delete Order

              </button>

              <button
                onClick={() =>
                  handleShareOrder(
                    orders[selectedOrder]
                  )
                }
                className="flex items-center gap-4 text-green-400 text-xl"
              >

                <Share2 />

                Share Order

              </button>

            </div>

          </div>

        </div>

      )}

      {/* RATING MODAL */}

      {showRatingModal && (

        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-zinc-900 p-8 rounded-3xl w-full max-w-md border border-zinc-800">

            <div className="flex justify-between items-center">

              <h2 className="text-3xl font-bold">

                Rate Order

              </h2>

              <button
                onClick={() =>
                  setShowRatingModal(false)
                }
              >

                <X />

              </button>

            </div>

            {/* STARS */}

            <div className="flex justify-center gap-3 mt-8">

              {[1, 2, 3, 4, 5].map(
                (star) => (

                  <button
                    key={star}
                    onClick={() =>
                      setSelectedRating(
                        star
                      )
                    }
                  >

                    <Star
                      size={40}
                      className={
                        star <=
                        selectedRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-500"
                      }
                    />

                  </button>

                )
              )}

            </div>

            {/* FEEDBACK */}

            <textarea
              placeholder="Write Feedback..."
              value={feedback}
              onChange={(e) =>
                setFeedback(
                  e.target.value
                )
              }
              className="w-full mt-8 p-4 rounded-2xl bg-zinc-800 outline-none"
              rows={4}
            />

            <button
              onClick={handleRateOrder}
              className="w-full bg-orange-500 py-4 rounded-2xl mt-6 hover:bg-orange-600 transition-all font-bold"
            >

              Submit Rating

            </button>

          </div>

        </div>

      )}

    </>

  );

}