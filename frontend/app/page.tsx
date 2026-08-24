"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/app/lib/getImageUrl";
import Navbar from "@/components/layout/Navbar";
import { getAccessToken } from "@/app/lib/auth/session";

import {
  requestNotificationPermission,
  listenNotifications,
} from "./notifications";

type Stall = {
  _id: string;
  name: string;
  image: string;
  description: string;
  is_open: boolean;
  active: boolean;
};

export default function Home() {
  const router = useRouter();

  const [stalls, setStalls] = useState<Stall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAccessToken("USER");

    if (!token) {
      window.location.replace("/login");
      return;
    }

    void fetchStalls();
  }, []);

  const fetchStalls = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://127.0.0.1:8000/stalls",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch stalls: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("🏪 Live stalls:", data);

      if (!Array.isArray(data?.stalls)) {
        throw new Error(
          "Invalid stalls response from server"
        );
      }

      setStalls(data.stalls);
    } catch (err) {
      console.error(
        "❌ Failed to load stalls:",
        err
      );

      setError(
        "Unable to load food stalls."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        await requestNotificationPermission();
        listenNotifications();
      } catch (error) {
        console.log(
          "Notification error:",
          error
        );
      }
    };

    void setupNotifications();
  }, []);

  const handleStallClick = (stall: Stall) => {
    if (!stall.is_open) {
      return;
    }

    router.push(
      `/stall/${encodeURIComponent(stall._id)}`
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-orange-500" />

          <p className="text-sm text-zinc-400">
            Loading food stalls...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-10">

        {/* HERO */}

        <section className="mb-10">
          <h1 className="text-3xl font-bold text-orange-500 sm:text-4xl lg:text-5xl">
            CampusVita
          </h1>

          <p className="mt-2 text-gray-400">
            Choose a food stall to explore its menu
          </p>
        </section>

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* STALL HEADER */}

        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                All Stalls
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a stall to view its food
              </p>
            </div>

            <span className="text-sm text-gray-500">
              {stalls.length}{" "}
              {stalls.length === 1
                ? "stall"
                : "stalls"}
            </span>
          </div>

          {/* EMPTY STATE */}

          {stalls.length === 0 && !error && (
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center">
              <div className="mb-4 text-5xl">
                🏪
              </div>

              <h3 className="text-xl font-semibold text-white">
                No food stalls available
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                There are currently no active food stalls.
              </p>
            </div>
          )}

          {/* STALL GRID */}

          {stalls.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">

              {stalls.map((stall) => {
                const isOpen = stall.is_open;

                return (
                  <button
                    key={stall._id}
                    type="button"
                    disabled={!isOpen}
                    onClick={() =>
                      handleStallClick(stall)
                    }
                    className={`group relative overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                      isOpen
                        ? "cursor-pointer border-zinc-800 bg-zinc-900 hover:-translate-y-1 hover:border-orange-500 hover:shadow-xl hover:shadow-orange-500/10"
                        : "cursor-not-allowed border-zinc-900 bg-black"
                    }`}
                  >

                    {/* IMAGE */}

                    <div className="relative aspect-square w-full overflow-hidden">

                      {stall.image ? (
                        <img
                        src={getImageUrl(stall.image)}
                          alt={stall.name}
                          className={`h-full w-full object-cover transition-all duration-300 ${
                            isOpen
                              ? "group-hover:scale-105"
                              : "brightness-[0.18] grayscale"
                          }`}
                        />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center ${
                            isOpen
                              ? "bg-zinc-900"
                              : "bg-black"
                          }`}
                        >
                          <span
                            className={`text-5xl ${
                              isOpen
                                ? ""
                                : "opacity-20"
                            }`}
                          >
                            🍽️
                          </span>
                        </div>
                      )}

                      {/* DARK OVERLAY FOR CLOSED */}

                      {!isOpen && (
                        <div className="absolute inset-0 bg-black/60" />
                      )}

                      {/* STATUS */}

                      <div
                        className={`absolute right-3 top-3 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${
                          isOpen
                            ? "bg-green-500 text-white"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOpen
                              ? "bg-white"
                              : "bg-red-500"
                          }`}
                        />

                        {isOpen
                          ? "Open"
                          : "Closed"}
                      </div>
                    </div>

                    {/* STALL INFO */}

                    <div
                      className={`p-4 ${
                        isOpen
                          ? "bg-zinc-900"
                          : "bg-black"
                      }`}
                    >
                      <h3
                        className={`line-clamp-1 text-base font-bold ${
                          isOpen
                            ? "text-white"
                            : "text-zinc-500"
                        }`}
                      >
                        {stall.name}
                      </h3>

                      {stall.description && (
                        <p
                          className={`mt-1 line-clamp-2 text-xs ${
                            isOpen
                              ? "text-zinc-500"
                              : "text-zinc-700"
                          }`}
                        >
                          {stall.description}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-2">

                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOpen
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />

                        <span
                          className={`text-xs font-medium ${
                            isOpen
                              ? "text-green-400"
                              : "text-zinc-600"
                          }`}
                        >
                          {isOpen
                            ? "Currently accepting orders"
                            : "Currently closed"}
                        </span>

                      </div>
                    </div>
                  </button>
                );
              })}

            </div>
          )}
        </section>
      </div>
    </main>
  );
}