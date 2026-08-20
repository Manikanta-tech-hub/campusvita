import { ArrowLeft, Building2, Mail, ShieldCheck, Utensils } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return <main className="min-h-screen bg-[#090a0a] px-4 py-5 text-white">
    <div className="mx-auto max-w-md">
      <header className="mb-6 flex items-center gap-3"><Link href="/profile" className="rounded-full p-2"><ArrowLeft size={22}/></Link><h1 className="text-xl font-bold">About Us</h1></header>
      <section className="rounded-3xl border border-zinc-800 bg-[#171919] p-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500"><Utensils size={30}/></div>
        <h2 className="mt-5 text-center text-2xl font-extrabold"><span>Campus</span><span className="text-orange-500">Vita</span></h2>
        <p className="mt-3 text-center text-sm leading-6 text-zinc-400">Smart Campus Food Ordering App for browsing campus food, placing orders, tracking order status, and managing your account.</p>
        <div className="mt-6 space-y-3">
          <div className="flex gap-3 rounded-2xl border border-zinc-800 p-4"><Building2 className="text-orange-500"/><div><p className="font-semibold">Campus food ordering</p><p className="text-xs text-zinc-400">Built around the existing CampusVita ordering experience.</p></div></div>
          <div className="flex gap-3 rounded-2xl border border-zinc-800 p-4"><ShieldCheck className="text-orange-500"/><div><p className="font-semibold">Authenticated account</p><p className="text-xs text-zinc-400">Profile and account actions use the signed-in CampusVita account.</p></div></div>
          <div className="flex gap-3 rounded-2xl border border-zinc-800 p-4"><Mail className="text-orange-500"/><div><p className="font-semibold">Support</p><p className="text-xs text-zinc-400">Use the support/contact channel already configured for your deployment.</p></div></div>
        </div>
      </section>
    </div>
  </main>;
}
