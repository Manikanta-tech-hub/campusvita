"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, KeyRound, Moon, Save, ShieldCheck, Sun } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    fetch(`${API_URL}/profile`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (r.status === 401) { router.replace("/login"); return; }
        if (!r.ok) throw new Error(d?.detail || "Failed to load settings");
        const p = d?.profile || d;
        setNotifications(p?.notifications !== false);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, [router]);

  const savePreferences = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ notifications, theme: theme || "dark" }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.detail || "Failed to save preferences");
      toast.success("Preferences saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to save preferences"); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!passwords.current || !passwords.next) { toast.error("Enter your current and new password."); return; }
    if (passwords.next !== passwords.confirm) { toast.error("New passwords do not match."); return; }
    if (passwords.next.length < 8) { toast.error("New password must be at least 8 characters."); return; }
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setChangingPassword(true);
    try {
      const r = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.next }),
      });
      const d = await r.json().catch(() => null);
      if (!r.ok) throw new Error(d?.detail || "Failed to change password");
      setPasswords({ current: "", next: "", confirm: "" });
      toast.success("Password changed successfully");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to change password"); }
    finally { setChangingPassword(false); }
  };

  if (loading) return <main className="min-h-screen bg-[#090a0a] p-5 text-white"><div className="mx-auto max-w-md animate-pulse space-y-4"><div className="h-8 w-32 rounded bg-zinc-800"/><div className="h-48 rounded-2xl bg-zinc-800"/><div className="h-48 rounded-2xl bg-zinc-800"/></div></main>;

  return <main className="min-h-screen bg-[#090a0a] px-4 pb-8 pt-5 text-white">
    <div className="mx-auto max-w-md">
      <header className="mb-5 flex items-center gap-3"><button onClick={() => router.back()} className="rounded-full p-2"><ArrowLeft size={22}/></button><h1 className="text-xl font-bold">Settings</h1></header>
      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#171919]">
        <div className="flex items-center gap-3 border-b border-zinc-800 p-4"><Bell className="text-orange-500"/><div className="flex-1"><p className="font-semibold">Notifications</p><p className="text-xs text-zinc-400">Use your saved CampusVita notification preference</p></div><button onClick={() => setNotifications(!notifications)} className={`h-7 w-12 rounded-full p-1 ${notifications ? "bg-orange-500" : "bg-zinc-700"}`} aria-label="Toggle notifications"><span className={`block h-5 w-5 rounded-full bg-white transition ${notifications ? "translate-x-5" : ""}`}/></button></div>
        <div className="flex items-center gap-3 border-b border-zinc-800 p-4"><Moon className="text-orange-500"/><div className="flex-1"><p className="font-semibold">Theme</p><p className="text-xs text-zinc-400">Use the existing app theme provider</p></div><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-xl border border-zinc-700 px-3 py-2 text-xs">{theme === "dark" ? <span className="inline-flex items-center gap-1"><Moon size={14}/> Dark</span> : <span className="inline-flex items-center gap-1"><Sun size={14}/> Light</span>}</button></div>
        <button onClick={() => void savePreferences()} disabled={saving} className="flex w-full items-center justify-center gap-2 p-4 text-sm font-bold text-orange-500 disabled:opacity-60"><Save size={17}/>{saving ? "Saving..." : "Save preferences"}</button>
      </section>
      <section className="mt-5 rounded-2xl border border-zinc-800 bg-[#171919] p-4">
        <div className="flex items-center gap-3"><ShieldCheck className="text-orange-500"/><div><h2 className="font-semibold">Security</h2><p className="text-xs text-zinc-400">Change your account password</p></div></div>
        <div className="mt-4 space-y-3">
          {(["current","next","confirm"] as const).map((key) => <input key={key} type="password" value={passwords[key]} onChange={(e) => setPasswords({...passwords,[key]:e.target.value})} placeholder={key === "current" ? "Current password" : key === "next" ? "New password" : "Confirm new password"} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-sm outline-none focus:border-orange-500"/>)}
          <button onClick={() => void changePassword()} disabled={changingPassword} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-sm font-bold disabled:opacity-60"><KeyRound size={17}/>{changingPassword ? "Changing..." : "Change password"}</button>
        </div>
      </section>
    </div>
  </main>;
}
