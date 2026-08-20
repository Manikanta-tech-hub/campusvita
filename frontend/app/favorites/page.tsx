"use client";

import { ArrowLeft, Heart, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function FavoritesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }

    fetch(`${API_URL}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => null);
          throw new Error(d?.detail || "Favorites service is not available in the current backend.");
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Unable to load favorites"))
      .finally(() => setLoading(false));
  }, [router]);

  return <main className="min-h-screen bg-[#090a0a] px-4 py-5 text-white">
    <div className="mx-auto max-w-md">
      <header className="mb-6 flex items-center gap-3"><button onClick={() => router.back()} className="rounded-full p-2"><ArrowLeft size={22}/></button><h1 className="text-xl font-bold">Favorites</h1></header>
      {loading ? <div className="flex items-center justify-center py-20 text-zinc-400"><RefreshCw className="mr-2 animate-spin"/>Loading favorites...</div> :
        error ? <section className="rounded-2xl border border-zinc-800 bg-[#171919] p-6 text-center"><Heart className="mx-auto text-orange-500" size={30}/><h2 className="mt-4 font-semibold">Favorites unavailable</h2><p className="mt-2 text-sm text-zinc-400">{error}</p><button onClick={() => window.location.reload()} className="mt-4 rounded-xl border border-orange-500 px-4 py-2 text-sm text-orange-400">Retry</button></section> :
        <section className="rounded-2xl border border-zinc-800 bg-[#171919] p-6 text-center"><Heart className="mx-auto text-orange-500" size={30}/><p className="mt-3 text-sm text-zinc-400">No favorite items are available.</p></section>}
    </div>
  </main>;
}
