"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Check,
  KeyRound,
  Moon,
  Save,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useTheme } from "next-themes";
import { getAccessToken } from "@/app/lib/auth/session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [notifications, setNotifications] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const token = getAccessToken("USER");

    if (!token) {
      router.replace("/login");
      return;
    }

    fetch(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json().catch(() => null);

        if (r.status === 401) {
          router.replace("/login");
          return;
        }

        if (!r.ok) {
          throw new Error(d?.detail || "Failed to load settings");
        }

        const p = d?.profile || d;

        setNotifications(p?.notifications !== false);
      })
      .catch((e) => {
        toast.error(
          e instanceof Error ? e.message : "Failed to load settings"
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const savePreferences = async () => {
    const token = getAccessToken("USER");

    if (!token) {
      router.replace("/login");
      return;
    }

    setSaving(true);

    try {
      const r = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notifications,
          theme: theme || "dark",
        }),
      });

      const d = await r.json().catch(() => null);

      if (!r.ok) {
        throw new Error(d?.detail || "Failed to save preferences");
      }

      toast.success("Preferences saved");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Failed to save preferences"
      );
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!passwords.current || !passwords.next) {
      toast.error("Enter your current and new password.");
      return;
    }

    if (passwords.next !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwords.next.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    const token = getAccessToken("USER");

    if (!token) {
      router.replace("/login");
      return;
    }

    setChangingPassword(true);

    try {
      const r = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: passwords.current,
          new_password: passwords.next,
        }),
      });

      const d = await r.json().catch(() => null);

      if (!r.ok) {
        throw new Error(
          d?.detail || "Failed to change password"
        );
      }

      setPasswords({
        current: "",
        next: "",
        confirm: "",
      });

      toast.success("Password changed successfully");
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-[var(--text-primary)] sm:px-6">
        <div className="mx-auto w-full max-w-3xl animate-pulse space-y-6">
          <div className="h-10 w-36 rounded-xl bg-[var(--surface-secondary)]" />

          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="h-24 border-b border-[var(--border)] bg-[var(--surface-secondary)]" />
            <div className="space-y-5 p-5">
              <div className="h-16 rounded-2xl bg-[var(--surface-secondary)]" />
              <div className="h-16 rounded-2xl bg-[var(--surface-secondary)]" />
              <div className="h-12 rounded-2xl bg-[var(--surface-secondary)]" />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="h-24 border-b border-[var(--border)] bg-[var(--surface-secondary)]" />
            <div className="space-y-4 p-5">
              <div className="h-12 rounded-2xl bg-[var(--surface-secondary)]" />
              <div className="h-12 rounded-2xl bg-[var(--surface-secondary)]" />
              <div className="h-12 rounded-2xl bg-[var(--surface-secondary)]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isDark = theme === "dark";

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 pb-10 pt-5 text-[var(--text-primary)] transition-colors duration-200 sm:px-6 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">

        {/* Header */}
        <header className="mb-7 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl border border-[var(--border)]
              bg-[var(--surface)]
              text-[var(--text-secondary)]
              shadow-sm
              transition
              hover:border-[var(--brand)]
              hover:bg-[var(--brand-soft)]
              hover:text-[var(--brand)]
              focus:outline-none
              focus:ring-2
              focus:ring-[var(--brand)]
              focus:ring-offset-2
              focus:ring-offset-[var(--background)]
            "
          >
            <ArrowLeft size={19} strokeWidth={2.2} />
          </button>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
              Account
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Settings
            </h1>

            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Manage your CampusVita preferences and security.
            </p>
          </div>
        </header>

        <div className="space-y-6">

          {/* Preferences */}
          <section
            className="
              overflow-hidden rounded-3xl
              border border-[var(--border)]
              bg-[var(--surface)]
              shadow-[var(--shadow-card)]
            "
          >
            <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex h-11 w-11 shrink-0 items-center justify-center
                    rounded-2xl
                    bg-[var(--brand-soft)]
                    text-[var(--brand)]
                  "
                >
                  <Bell size={20} strokeWidth={2.1} />
                </div>

                <div>
                  <h2 className="text-base font-bold sm:text-lg">
                    Preferences
                  </h2>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Control how CampusVita looks and keeps you informed.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[var(--border)]">

              {/* Notifications */}
              <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                <div
                  className="
                    flex h-10 w-10 shrink-0 items-center justify-center
                    rounded-xl
                    bg-[var(--surface-secondary)]
                    text-[var(--text-secondary)]
                  "
                >
                  <Bell size={18} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Notifications
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
                    Use your saved CampusVita notification preference.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setNotifications(!notifications)}
                  aria-label={
                    notifications
                      ? "Disable notifications"
                      : "Enable notifications"
                  }
                  aria-pressed={notifications}
                  className={`
                    relative h-7 w-12 shrink-0 rounded-full p-1
                    transition-colors duration-200
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[var(--brand)]
                    focus:ring-offset-2
                    focus:ring-offset-[var(--surface)]
                    ${
                      notifications
                        ? "bg-[var(--brand)]"
                        : "bg-[var(--border-strong)]"
                    }
                  `}
                >
                  <span
                    className={`
                      block h-5 w-5 rounded-full
                      bg-white shadow-sm
                      transition-transform duration-200
                      ${
                        notifications
                          ? "translate-x-5"
                          : "translate-x-0"
                      }
                    `}
                  />
                </button>
              </div>

              {/* Theme */}
              <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                <div
                  className="
                    flex h-10 w-10 shrink-0 items-center justify-center
                    rounded-xl
                    bg-[var(--surface-secondary)]
                    text-[var(--brand)]
                  "
                >
                  {isDark ? (
                    <Moon size={18} />
                  ) : (
                    <Sun size={18} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    Appearance
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
                    Choose how CampusVita appears on your device.
                  </p>
                </div>

                <div
                  className="
                    flex shrink-0 items-center rounded-xl
                    border border-[var(--border)]
                    bg-[var(--surface-secondary)]
                    p-1
                  "
                >
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    aria-label="Use light theme"
                    aria-pressed={theme === "light"}
                    className={`
                      flex items-center gap-1.5 rounded-lg
                      px-3 py-2 text-xs font-semibold
                      transition
                      sm:px-3.5
                      ${
                        theme === "light"
                          ? "bg-[var(--surface)] text-[var(--brand)] shadow-sm"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }
                    `}
                  >
                    <Sun size={14} />
                    <span className="hidden sm:inline">
                      Light
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    aria-label="Use dark theme"
                    aria-pressed={theme === "dark"}
                    className={`
                      flex items-center gap-1.5 rounded-lg
                      px-3 py-2 text-xs font-semibold
                      transition
                      sm:px-3.5
                      ${
                        theme === "dark"
                          ? "bg-[var(--surface)] text-[var(--brand)] shadow-sm"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }
                    `}
                  >
                    <Moon size={14} />
                    <span className="hidden sm:inline">
                      Dark
                    </span>
                  </button>
                </div>
              </div>

              {/* Save */}
              <div className="bg-[var(--surface-secondary)] px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => void savePreferences()}
                  disabled={saving}
                  className="
                    flex w-full items-center justify-center gap-2
                    rounded-xl
                    bg-[var(--brand)]
                    px-4 py-3
                    text-sm font-bold
                    text-white
                    shadow-sm
                    transition
                    hover:brightness-95
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[var(--brand)]
                    focus:ring-offset-2
                    focus:ring-offset-[var(--surface-secondary)]
                  "
                >
                  <Save size={17} />

                  {saving
                    ? "Saving..."
                    : "Save preferences"}
                </button>
              </div>
            </div>
          </section>

          {/* Security */}
          <section
            className="
              overflow-hidden rounded-3xl
              border border-[var(--border)]
              bg-[var(--surface)]
              shadow-[var(--shadow-card)]
            "
          >
            <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
              <div className="flex items-start gap-3">
                <div
                  className="
                    flex h-11 w-11 shrink-0 items-center justify-center
                    rounded-2xl
                    bg-[var(--brand-soft)]
                    text-[var(--brand)]
                  "
                >
                  <ShieldCheck size={20} strokeWidth={2.1} />
                </div>

                <div>
                  <h2 className="text-base font-bold sm:text-lg">
                    Security
                  </h2>

                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Keep your CampusVita account protected.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">

              <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-[var(--brand)]">
                    <KeyRound size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Change your password
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
                      Use a strong password with at least 8 characters.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {(
                  ["current", "next", "confirm"] as const
                ).map((key) => {
                  const placeholder =
                    key === "current"
                      ? "Current password"
                      : key === "next"
                        ? "New password"
                        : "Confirm new password";

                  return (
                    <div key={key}>
                      <label
                        htmlFor={`password-${key}`}
                        className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]"
                      >
                        {placeholder}
                      </label>

                      <input
                        id={`password-${key}`}
                        type="password"
                        value={passwords[key]}
                        onChange={(e) =>
                          setPasswords({
                            ...passwords,
                            [key]: e.target.value,
                          })
                        }
                        placeholder={placeholder}
                        autoComplete={
                          key === "current"
                            ? "current-password"
                            : "new-password"
                        }
                        className="
                          w-full rounded-xl
                          border border-[var(--border)]
                          bg-[var(--surface-secondary)]
                          px-4 py-3
                          text-sm
                          text-[var(--text-primary)]
                          placeholder:text-[var(--text-muted)]
                          outline-none
                          transition
                          focus:border-[var(--brand)]
                          focus:bg-[var(--surface)]
                          focus:ring-2
                          focus:ring-[var(--brand-soft)]
                        "
                      />
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => void changePassword()}
                  disabled={changingPassword}
                  className="
                    mt-2 flex w-full items-center justify-center gap-2
                    rounded-xl
                    bg-[var(--brand)]
                    px-4 py-3
                    text-sm font-bold
                    text-white
                    shadow-sm
                    transition
                    hover:brightness-95
                    active:scale-[0.99]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    focus:outline-none
                    focus:ring-2
                    focus:ring-[var(--brand)]
                    focus:ring-offset-2
                    focus:ring-offset-[var(--surface)]
                  "
                >
                  {changingPassword ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Changing...
                    </>
                  ) : (
                    <>
                      <KeyRound size={17} />
                      Change password
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Security reassurance */}
          <div
            className="
              flex items-center justify-center gap-2
              px-4 text-center
              text-xs text-[var(--text-muted)]
            "
          >
            <Check size={14} className="text-[var(--brand)]" />
            Your preferences are saved to your CampusVita account.
          </div>
        </div>
      </div>
    </main>
  );
}