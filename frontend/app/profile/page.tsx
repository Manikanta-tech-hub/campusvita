"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  Camera, CheckCircle2, ChevronRight, GraduationCap, Heart, HelpCircle,
  Home, IndianRupee, LogOut, Mail, Pencil, Phone, Receipt, RefreshCw,
  Settings, Share2, ShoppingBag, User, Building2, X
} from "lucide-react";
import { getImageUrl } from "@/app/lib/getImageUrl";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Profile = {
  name: string; email: string; phone: string; department: string; year: string;
  profile_image: string; total_orders: number; total_spent: number;
  is_verified: boolean; notifications: boolean; theme: string;
};

const EMPTY: Profile = {
  name: "", email: "", phone: "", department: "", year: "", profile_image: "",
  total_orders: 0, total_spent: 0, is_verified: false, notifications: true, theme: "dark",
};

function apiError(value: unknown, fallback: string) {
  if (typeof value === "string" && value) return value;
  if (Array.isArray(value)) {
    return value.map((x) => {
      if (typeof x === "string") return x;
      if (x && typeof x === "object") {
        const o = x as Record<string, unknown>;
        return String(o.msg || o.message || o.detail || "");
      }
      return "";
    }).filter(Boolean).join(", ") || fallback;
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return String(o.detail || o.message || o.error || fallback);
  }
  return fallback;
}

function Skeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-800/80 ${className}`} />;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [draft, setDraft] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editField, setEditField] = useState<keyof Pick<Profile, "name"|"email"|"phone"|"department"|"year"> | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [version, setVersion] = useState<any>(null);
  const [versionError, setVersionError] = useState("");
  const [shareBusy, setShareBusy] = useState(false);

  const clearAuth = useCallback(() => {
    ["access_token","refresh_token","token_type","expires_in","isLoggedIn",
     "userEmail","email","userName","userRole"].forEach((k) => localStorage.removeItem(k));
  }, []);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store"
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) { clearAuth(); router.replace("/login"); return; }
      if (!res.ok) throw new Error(apiError(data, "Unable to load profile"));
      const s = data?.profile && typeof data.profile === "object" ? data.profile : data;
      const next: Profile = {
        name: String(s?.name ?? ""), email: String(s?.email ?? ""),
        phone: String(s?.phone ?? ""), department: String(s?.department ?? ""),
        year: String(s?.year ?? ""), profile_image: String(s?.profile_image ?? ""),
        total_orders: Number(s?.total_orders ?? 0), total_spent: Number(s?.total_spent ?? 0),
        is_verified: Boolean(s?.is_verified ?? s?.verified ?? false),
        notifications: s?.notifications !== false, theme: String(s?.theme ?? "dark"),
      };
      setProfile(next); setDraft(next);
      if (next.name) localStorage.setItem("userName", next.name);
      if (next.email) {
        localStorage.setItem("userEmail", next.email);
        localStorage.setItem("email", next.email);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load profile");
    } finally { setLoading(false); }
  }, [clearAuth, router]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  useEffect(() => {
    fetch("/api/app-version", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok) throw new Error(apiError(d, "Unable to check for updates"));
        setVersion(d);
      })
      .catch((e) => setVersionError(e instanceof Error ? e.message : "Unable to check for updates"));
  }, []);

  const initials = useMemo(() => {
    const p = profile.name.trim().split(/\s+/).filter(Boolean);
    return (p.slice(0, 2).map((x) => x[0]).join("") || "CV").toUpperCase();
  }, [profile.name]);

  const openEdit = (field?: typeof editField) => {
    setDraft(profile); setEditField(field ?? null); setEditOpen(true);
  };

  const saveProfile = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    if (!draft.name.trim()) { toast.error("Name is required."); return; }
    if (draft.phone && !/^[6789]\d{9}$/.test(draft.phone.trim())) {
      toast.error("Enter a valid 10-digit Indian mobile number."); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(), phone: draft.phone.trim(),
          department: draft.department.trim(), year: draft.year,
          profile_image: profile.profile_image,
          notifications: profile.notifications, theme: profile.theme,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) { clearAuth(); router.replace("/login"); return; }
      if (!res.ok) throw new Error(apiError(data, "Failed to update profile"));
      const s = data?.profile && typeof data.profile === "object" ? data.profile : data;
      const next = {
        ...profile, name: String(s?.name ?? draft.name), email: String(s?.email ?? profile.email),
        phone: String(s?.phone ?? draft.phone), department: String(s?.department ?? draft.department),
        year: String(s?.year ?? draft.year), profile_image: String(s?.profile_image ?? profile.profile_image),
        notifications: s?.notifications ?? profile.notifications, theme: String(s?.theme ?? profile.theme),
      };
      setProfile(next); setDraft(next); setEditOpen(false); setEditField(null);
      localStorage.setItem("userName", next.name);
      toast.success("Profile updated successfully");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed to update profile"); }
    finally { setSaving(false); }
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be smaller than 5 MB."); return; }
    const token = localStorage.getItem("access_token");
    if (!token) { router.replace("/login"); return; }
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`${API_URL}/profile/upload-image`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) { clearAuth(); router.replace("/login"); return; }
      if (!res.ok) throw new Error(apiError(data, "Failed to upload profile image"));
      const url = String(data?.image_url ?? data?.profile_image ?? data?.url ?? "");
      if (!url) throw new Error("The server did not return an image URL.");
      setProfile((p) => ({ ...p, profile_image: url }));
      setDraft((p) => ({ ...p, profile_image: url }));
      toast.success("Profile photo updated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  const shareApp = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    try {
      const data = { title: "CampusVita", text: "Smart Campus Food Ordering App", url: window.location.origin };
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); toast.success("CampusVita link copied"); }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) toast.error("Unable to share the app");
    } finally { setShareBusy(false); }
  };

  const logout = () => {
    clearAuth(); setLogoutOpen(false); router.replace("/login");
  };

  if (loading) {
    return <main className="min-h-screen bg-[#090a0a] px-4 pt-6 text-white"><div className="mx-auto max-w-md space-y-4">
      <div className="flex justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-10 w-10 rounded-full" /></div>
      <Skeleton className="h-36" /><Skeleton className="h-5 w-36" /><div className="grid grid-cols-2 gap-3"><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-20" /><Skeleton className="h-64" /><Skeleton className="h-56" />
    </div></main>;
  }

  return <main className="min-h-screen bg-[#090a0a] px-3 pb-[96px] pt-5 text-white sm:px-5">
    <div className="mx-auto max-w-md">
      <header className="relative mb-4 flex h-9 items-center justify-center">
        <div className="text-[29px] font-extrabold"><span>Campus</span><span className="text-orange-500">Vita</span></div>
        <button onClick={() => router.push("/settings")} aria-label="Open settings" className="absolute right-0 rounded-full p-2 active:scale-95"><Settings size={24}/></button>
      </header>

      {error && <div className="mb-4 rounded-2xl border border-red-900/60 bg-[#171919] p-4 text-center">
        <p className="font-semibold">Unable to load profile</p><p className="mt-1 text-xs text-zinc-400">{error}</p>
        <button onClick={() => void loadProfile()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-orange-500 px-4 py-2 text-sm text-orange-400"><RefreshCw size={15}/> Retry</button>
      </div>}

      <section className="rounded-[24px] border border-zinc-800 bg-[#171919] p-4 shadow-xl">
        <div className="flex gap-4">
          <div className="relative shrink-0">
            <div className="h-[116px] w-[116px] rounded-full border-2 border-orange-500 p-1">
              {profile.profile_image ? <img src={getImageUrl(profile.profile_image)} alt="Profile photo" className="h-full w-full rounded-full object-cover"/> :
                <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-800 text-3xl font-bold text-orange-400">{initials}</div>}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Change profile photo" className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 shadow-lg active:scale-90">
              {uploading ? <RefreshCw size={18} className="animate-spin"/> : <Camera size={19}/>}
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={uploadImage} className="hidden"/>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h1 className="truncate text-[22px] font-bold">{profile.name || "Not added"}</h1>{profile.is_verified && <CheckCircle2 size={20} className="shrink-0 text-orange-500" fill="currentColor"/>}</div>
            <p className="mt-2 truncate text-sm text-zinc-300">{profile.department || "Not added"}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-300"><Phone size={17}/>{profile.phone || "Not added"}</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-zinc-300"><GraduationCap size={18}/>{profile.year || "Not added"}</p>
            <button onClick={() => openEdit()} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-orange-500 px-3.5 py-2 text-xs font-semibold text-orange-400 active:scale-95"><Pencil size={14}/> Edit Profile</button>
          </div>
        </div>
      </section>

      <section className="mt-4"><h2 className="mb-2 px-1 text-lg font-bold">Your Activity</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[22px] border border-zinc-800 bg-[#171919] p-4 text-center"><ShoppingBag className="mx-auto text-orange-500" size={27}/><p className="mt-2 text-[29px] font-bold">{profile.total_orders || 0}</p><p className="mt-1 text-sm text-zinc-300">Total Orders</p></div>
          <div className="rounded-[22px] border border-zinc-800 bg-[#171919] p-4 text-center"><IndianRupee className="mx-auto text-orange-500" size={27}/><p className="mt-2 text-[27px] font-bold">₹{Number(profile.total_spent || 0).toLocaleString("en-IN")}</p><p className="mt-1 text-sm text-zinc-300">Total Spent</p></div>
        </div>
      </section>

      <button onClick={() => version?.updateAvailable && version.updateUrl ? window.open(version.updateUrl, "_blank", "noopener,noreferrer") : undefined} className="mt-4 flex w-full items-center gap-3 rounded-[22px] border border-zinc-800 bg-[#171919] p-3.5 text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300"><RefreshCw size={22}/></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{version?.updateAvailable ? "App update available" : versionError ? "Update check unavailable" : "You're up to date"}</p>
          <p className="mt-0.5 truncate text-xs text-zinc-400">{versionError || (version?.updateAvailable ? `A newer version ${version.latestVersion} is available` : `Current version ${version?.currentVersion ?? "Not available"}`)}</p>
        </div><ChevronRight size={21} className="text-zinc-400"/>
      </button>

      <section className="mt-5"><h2 className="mb-2 px-1 text-lg font-bold">About You</h2>
        <div className="overflow-hidden rounded-[22px] border border-zinc-800 bg-[#171919]">
          <InfoRow icon={<User size={21}/>} label="Full Name" value={profile.name} onClick={() => openEdit("name")}/>
          <InfoRow icon={<Mail size={21}/>} label="Email" value={profile.email} onClick={() => openEdit("email")}/>
          <InfoRow icon={<Phone size={21}/>} label="Phone Number" value={profile.phone} onClick={() => openEdit("phone")}/>
          <InfoRow icon={<Building2 size={21}/>} label="Department / Branch" value={profile.department} onClick={() => openEdit("department")}/>
          <InfoRow icon={<GraduationCap size={21}/>} label="Academic Year" value={profile.year} onClick={() => openEdit("year")} last/>
        </div>
      </section>

      <section className="mt-5"><h2 className="mb-2 px-1 text-lg font-bold">Account</h2>
        <div className="overflow-hidden rounded-[22px] border border-zinc-800 bg-[#171919]">
          <AccountRow icon={<Heart size={22}/>} title="Favorites" subtitle="Your saved food items" href="/favorites"/>
          <AccountRow icon={<Receipt size={22}/>} title="Payment History" subtitle="View your transactions" href="/wallet/transactions"/>
          <AccountRow icon={<HelpCircle size={22}/>} title="About Us" subtitle="Learn more about CampusVita" href="/about"/>
          <button onClick={shareApp} disabled={shareBusy} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-zinc-900 disabled:opacity-60">
            <span className="text-orange-500">{shareBusy ? <RefreshCw size={22} className="animate-spin"/> : <Share2 size={22}/>}</span>
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Share the App</span><span className="mt-0.5 block text-xs text-zinc-400">Invite your friends to CampusVita</span></span><ChevronRight size={21} className="text-zinc-400"/>
          </button>
        </div>
      </section>

      <button onClick={() => setLogoutOpen(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[20px] border border-zinc-800 bg-[#171919] py-3.5 font-semibold text-orange-500 active:scale-[0.99]"><LogOut size={21}/> Logout</button>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-[#0c0d0d]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid h-[68px] max-w-md grid-cols-3">
          <Bottom href="/" icon={<Home size={23}/>} label="Home"/><Bottom href="/orders" icon={<ShoppingBag size={23}/>} label="Orders"/><Bottom href="/profile" icon={<User size={23}/>} label="Profile" active/>
        </div>
      </nav>

      {editOpen && <Modal onClose={() => !saving && setEditOpen(false)}>
        <div className="flex items-center justify-between border-b border-zinc-800 p-5"><div><h2 className="text-lg font-bold">Edit Profile</h2><p className="mt-1 text-xs text-zinc-400">Saved to your authenticated account.</p></div><button onClick={() => setEditOpen(false)} aria-label="Close"><X size={21}/></button></div>
        <div className="space-y-4 p-5">
          <Field label="Full Name" value={draft.name} onChange={(v) => setDraft({...draft,name:v})} show={editField === null || editField === "name"}/>
          <Field label="Email" value={draft.email} disabled show={editField === null || editField === "email"} hint="Email is controlled by the authenticated account."/>
          <Field label="Phone Number" value={draft.phone} onChange={(v) => setDraft({...draft,phone:v.replace(/\D/g,"").slice(0,10)})} show={editField === null || editField === "phone"}/>
          <Field label="Department / Branch" value={draft.department} onChange={(v) => setDraft({...draft,department:v})} show={editField === null || editField === "department"}/>
          <Field label="Academic Year" value={draft.year} onChange={(v) => setDraft({...draft,year:v})} show={editField === null || editField === "year"}/>
          <div className="flex gap-3 pt-2"><button onClick={() => setEditOpen(false)} disabled={saving} className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm">Cancel</button><button onClick={() => void saveProfile()} disabled={saving || editField === "email"} className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold disabled:opacity-60">{saving ? "Saving..." : editField === "email" ? "Email cannot be changed" : "Save changes"}</button></div>
        </div>
      </Modal>}

      {logoutOpen && <Modal onClose={() => setLogoutOpen(false)}>
        <div className="p-5 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500"><LogOut size={24}/></div><h2 className="mt-4 text-lg font-bold">Sign out of CampusVita?</h2><p className="mt-2 text-sm text-zinc-400">You will need to sign in again to access your account.</p><div className="mt-5 flex gap-3"><button onClick={() => setLogoutOpen(false)} className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm">Cancel</button><button onClick={logout} className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-bold">Logout</button></div></div>
      </Modal>}
    </div>
  </main>;
}

function InfoRow({icon,label,value,onClick,last=false}:{icon:React.ReactNode;label:string;value:string;onClick:()=>void;last?:boolean}) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-zinc-900 ${last ? "" : "border-b border-zinc-800"}`}><span className="text-zinc-300">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm text-zinc-200">{label}</span><span className={`mt-0.5 block truncate text-sm ${value ? "text-zinc-300" : "text-zinc-500"}`}>{value || "Not added"}</span></span><ChevronRight size={20} className="text-zinc-500"/></button>;
}
function AccountRow({icon,title,subtitle,href}:{icon:React.ReactNode;title:string;subtitle:string;href:string}) {
  return <button onClick={() => window.location.assign(href)} className="flex w-full items-center gap-3 border-b border-zinc-800 px-4 py-3.5 text-left last:border-0 active:bg-zinc-900"><span className="text-orange-500">{icon}</span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block text-xs text-zinc-400">{subtitle}</span></span><ChevronRight size={21} className="text-zinc-400"/></button>;
}
function Bottom({href,icon,label,active=false}:{href:string;icon:React.ReactNode;label:string;active?:boolean}) {
  return <button onClick={() => window.location.assign(href)} className={`flex flex-col items-center justify-center gap-1 text-xs active:scale-95 ${active ? "text-orange-500" : "text-zinc-500"}`}>{icon}<span>{label}</span></button>;
}
function Field({label,value,onChange,disabled=false,hint,show}:{label:string;value:string;onChange?:(v:string)=>void;disabled?:boolean;hint?:string;show:boolean}) {
  if (!show) return null;
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-zinc-300">{label}</span><input value={value} disabled={disabled} onChange={(e)=>onChange?.(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-sm text-white outline-none focus:border-orange-500 disabled:text-zinc-500"/>{hint && <span className="mt-1 block text-[11px] text-zinc-500">{hint}</span>}</label>;
}
function Modal({children,onClose}:{children:React.ReactNode;onClose:()=>void}) {
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-3 backdrop-blur-sm sm:items-center"><button aria-label="Close dialog" onClick={onClose} className="absolute inset-0"/><div className="relative z-10 w-full max-w-md overflow-hidden rounded-[26px] border border-zinc-800 bg-[#151717] shadow-2xl">{children}</div></div>;
}
