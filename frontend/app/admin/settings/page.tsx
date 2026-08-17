"use client";

import {
  Bell,
  Camera,
  Check,
  ChevronRight,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  Palette,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { getImageUrl } from "@/app/lib/getImageUrl";
import {
  changeAdminPassword,
  getAdminSettingsProfile,
  type AdminProfileUpdate,
  updateAdminSettingsProfile,
  uploadAdminProfileImage,
} from "@/app/lib/settingsApi";

type ProfileState = {
  id: string;
  email: string;
  name: string;
  phone: string;
  department: string;
  year: string;
  profile_image: string;
  notifications: boolean;
  theme: string;
};

const EMPTY_PROFILE: ProfileState = {
  id: "",
  email: "",
  name: "",
  phone: "",
  department: "",
  year: "",
  profile_image: "",
  notifications: true,
  theme: "dark",
};

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  footer,
}: {
  title: string;
  description: string;
  icon: typeof User;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-[#111113] shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="flex items-start gap-4 border-b border-zinc-800 px-5 py-5 sm:px-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
          <Icon size={20} />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-zinc-500">
            {description}
          </p>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">{children}</div>

      {footer ? (
        <div className="border-t border-zinc-800 px-5 py-4 sm:px-6">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  inputMode,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  inputMode?: "text" | "tel" | "email";
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        className="w-full rounded-2xl border border-zinc-800 bg-[#0b0b0d] px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

export default function AdminSettingsPage() {
  const { setTheme } = useTheme();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileState>(EMPTY_PROFILE);
  const [initialProfile, setInitialProfile] =
    useState<ProfileState>(EMPTY_PROFILE);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      try {
        setLoading(true);
        setProfileError("");

        const data = await getAdminSettingsProfile();

        if (cancelled) return;

        const liveProfile: ProfileState = {
          id: data.id ?? "",
          email: data.email ?? "",
          name: data.name ?? "",
          phone: data.phone ?? "",
          department: data.department ?? "",
          year: data.year ?? "",
          profile_image: data.profile_image ?? "",
          notifications: data.notifications ?? true,
          theme: data.theme ?? "dark",
        };
        
        setProfile(liveProfile);
        setInitialProfile(liveProfile);
        
        // Apply the theme saved in the backend
        setTheme(liveProfile.theme);
      } catch (error) {
        if (cancelled) return;

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load settings";

        setProfileError(message);

        if (message.toLowerCase().includes("token")) {
          router.replace("/login");
        } else {
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSettings();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const profileImageUrl = useMemo(
    () => getImageUrl(profile.profile_image),
    [profile.profile_image]
  );

  const profileDirty = useMemo(
    () => JSON.stringify(profile) !== JSON.stringify(initialProfile),
    [profile, initialProfile]
  );

  function validateProfile() {
    if (!profile.name.trim()) {
      return "Name is required.";
    }

    if (profile.phone.trim()) {
      if (!/^\d{10}$/.test(profile.phone.trim())) {
        return "Phone number must be exactly 10 digits.";
      }

      if (!/^[6789]/.test(profile.phone.trim())) {
        return "Please enter a valid Indian mobile number.";
      }
    }

    return "";
  }

  async function handleProfileSave() {
    const validationError = validateProfile();

    if (validationError) {
      setProfileError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setSavingProfile(true);
      setProfileError("");

      const payload: AdminProfileUpdate = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        department: profile.department.trim(),
        year: profile.year,
        profile_image: profile.profile_image,
        notifications: profile.notifications,
        theme: profile.theme,
      };

      const saved = await updateAdminSettingsProfile(payload);
      setTheme(saved.theme ?? payload.theme);
      const savedProfile: ProfileState = {
        ...profile,
        name: saved.name ?? payload.name,
        email: saved.email ?? profile.email,
        phone: saved.phone ?? payload.phone,
        department: saved.department ?? payload.department,
        year: saved.year ?? payload.year,
        profile_image: saved.profile_image ?? payload.profile_image,
        notifications:
          saved.notifications ?? payload.notifications,
        theme: saved.theme ?? payload.theme,
      };

      setProfile(savedProfile);
      setInitialProfile(savedProfile);

      toast.success("Settings saved successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save settings";

      setProfileError(message);
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image must be smaller than 5 MB.");
      return;
    }

    try {
      setUploadingImage(true);

      const data = await uploadAdminProfileImage(file);
      const savedImage = data.profile_image || data.image_url || "";

      if (!savedImage || savedImage.startsWith("blob:")) {
        throw new Error(
          "Backend did not return a permanent profile image path."
        );
      }

      setProfile((current) => ({
        ...current,
        profile_image: savedImage,
      }));

      toast.success("Profile image updated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload profile image"
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function validatePassword() {
    if (!currentPassword) return "Current password is required.";
    if (newPassword.length < 8) {
      return "New password must contain at least 8 characters.";
    }
    if (!/[A-Z]/.test(newPassword)) {
      return "New password needs at least one uppercase letter.";
    }
    if (!/[a-z]/.test(newPassword)) {
      return "New password needs at least one lowercase letter.";
    }
    if (!/\d/.test(newPassword)) {
      return "New password needs at least one number.";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return "New password needs at least one special character.";
    }
    if (newPassword !== confirmPassword) {
      return "New passwords do not match.";
    }

    return "";
  }

  async function handlePasswordChange() {
    const validationError = validatePassword();

    if (validationError) {
      setPasswordError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordError("");

      await changeAdminPassword(currentPassword, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password changed successfully.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to change password";

      setPasswordError(message);
      toast.error(message);
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-900" />
        <div className="h-4 w-72 animate-pulse rounded bg-zinc-900" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="h-96 animate-pulse rounded-3xl bg-zinc-900" />
          <div className="h-64 animate-pulse rounded-3xl bg-zinc-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span>Admin</span>
          <ChevronRight size={14} />
          <span className="text-zinc-300">Settings</span>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Manage the authenticated administrator profile, application
            preferences, notifications, and account security.
          </p>
        </div>
      </div>

      {profileError ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {profileError}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <SectionCard
            title="Profile Settings"
            description="Update the profile fields already stored for your authenticated account."
            icon={User}
            footer={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">
                  Only profile fields supported by the existing backend are
                  editable.
                </p>

                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={savingProfile || !profileDirty}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />
                  {savingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            }
          >
            <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 shrink-0">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Administrator profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-zinc-600" />
                  )}
                </div>

                <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-zinc-800 bg-[#111113] text-orange-500 shadow-lg transition hover:bg-zinc-900">
                  <Camera size={16} />
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <div>
                <p className="font-semibold text-white">
                  {profile.name || "Administrator"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {profile.email || "Authenticated administrator"}
                </p>
                <p className="mt-2 text-xs text-zinc-600">
                  {uploadingImage
                    ? "Uploading image..."
                    : "JPG, PNG or WEBP · max 5 MB"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Full name"
                value={profile.name}
                onChange={(value) =>
                  setProfile((current) => ({ ...current, name: value }))
                }
                placeholder="Enter your name"
              />

              <Field
                label="Phone"
                value={profile.phone}
                onChange={(value) =>
                  setProfile((current) => ({ ...current, phone: value }))
                }
                placeholder="10-digit mobile number"
                inputMode="tel"
              />

              <Field
                label="Department"
                value={profile.department}
                onChange={(value) =>
                  setProfile((current) => ({
                    ...current,
                    department: value,
                  }))
                }
                placeholder="Department"
              />

              <Field
                label="Year"
                value={profile.year}
                onChange={(value) =>
                  setProfile((current) => ({ ...current, year: value }))
                }
                placeholder="Academic year"
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Account Settings"
            description="Account identity is read from the authenticated backend profile."
            icon={Mail}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Field
                label="Email address"
                value={profile.email}
                disabled
                type="email"
              />

              <div>
                <span className="mb-2 block text-sm font-medium text-zinc-300">
                  Account status
                </span>
                <div className="flex min-h-[48px] items-center gap-2 rounded-2xl border border-zinc-800 bg-[#0b0b0d] px-4 text-sm text-zinc-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Authenticated account
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Application Settings"
            description="Use the preference fields already supported by the current user schema."
            icon={Palette}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-zinc-800 bg-[#0b0b0d] p-4">
                <div className="flex items-center gap-3">
                  <Moon size={18} className="text-orange-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">Theme</p>
                    <p className="text-xs text-zinc-600">
                      Persisted with your existing account settings.
                    </p>
                  </div>
                </div>

                <select
  value={profile.theme}
  onChange={(event) => {
    const selectedTheme = event.target.value;

    setProfile((current) => ({
      ...current,
      theme: selectedTheme,
    }));

    setTheme(selectedTheme);
  }}
  className="mt-4 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500"
>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </label>

              <div className="rounded-2xl border border-zinc-800 bg-[#0b0b0d] p-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck size={18} className="text-orange-500" />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Existing backend
                    </p>
                    <p className="text-xs leading-5 text-zinc-600">
                      No unsupported application controls were added.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Notification Settings"
            description="Control the notification preference already stored on the user document."
            icon={Bell}
          >
            <button
              type="button"
              onClick={() =>
                setProfile((current) => ({
                  ...current,
                  notifications: !current.notifications,
                }))
              }
              className="flex w-full items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-[#0b0b0d] p-4 text-left transition hover:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Bell size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Notifications
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    {profile.notifications
                      ? "Notifications are enabled."
                      : "Notifications are disabled."}
                  </p>
                </div>
              </div>

              <span
                className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
                  profile.notifications
                    ? "bg-orange-500"
                    : "bg-zinc-800"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white transition ${
                    profile.notifications
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </span>
            </button>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard
            title="Security Settings"
            description="Change the authenticated account password using the existing secure backend flow."
            icon={LockKeyhole}
          >
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-zinc-800 bg-[#0b0b0d] p-4">
              <KeyRound size={18} className="mt-0.5 text-orange-500" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Password change
                </p>
                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  Your current password is verified server-side before a new
                  bcrypt hash is stored.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Field
                label="Current password"
                value={currentPassword}
                onChange={setCurrentPassword}
                type="password"
                placeholder="Enter current password"
              />

              <Field
                label="New password"
                value={newPassword}
                onChange={setNewPassword}
                type="password"
                placeholder="Minimum 8 characters"
              />

              <Field
                label="Confirm new password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                type="password"
                placeholder="Repeat new password"
              />

              {passwordError ? (
                <p className="text-sm text-red-300">{passwordError}</p>
              ) : null}

              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={
                  changingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LockKeyhole size={17} />
                {changingPassword ? "Updating..." : "Change Password"}
              </button>
            </div>
          </SectionCard>

          <div className="rounded-3xl border border-zinc-800 bg-[#111113] p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Check size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Live database settings
                </h3>
                <p className="mt-1 text-xs leading-5 text-zinc-600">
                  Values shown here are loaded from the authenticated
                  backend profile and saved back through the existing
                  MongoDB-backed endpoints. No settings records are created.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
