import { getAccessToken } from "@/app/lib/auth/session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ApiError = {
  detail?: string;
  message?: string;
};

async function readError(
  response: Response,
  fallback: string
): Promise<string> {
  const data = (await response.json().catch(() => ({}))) as ApiError;

  return data.detail || data.message || fallback;
}

/**
 * Get the ADMIN access token.
 *
 * IMPORTANT:
 * This file is used only by Admin Settings,
 * so it MUST use the ADMIN session.
 */
function getAdminAccessToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return getAccessToken("ADMIN") || "";
}

/**
 * Authorization headers for Admin API requests.
 */
function authHeaders(): Record<string, string> {
  const token = getAdminAccessToken();

  if (!token) {
    throw new Error("No admin access token found");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Get logged-in ADMIN profile/settings.
 */
export async function getAdminSettingsProfile() {
  const response = await fetch(`${API_URL}/profile`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      await readError(
        response,
        "Failed to load admin settings"
      )
    );
  }

  return response.json();
}

export type AdminProfileUpdate = {
  name: string;
  phone: string;
  department: string;
  year: string;
  profile_image: string;
  notifications: boolean;
  theme: string;
};

/**
 * Update logged-in ADMIN profile/settings.
 */
export async function updateAdminSettingsProfile(
  profile: AdminProfileUpdate
) {
  const response = await fetch(`${API_URL}/profile`, {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(
      await readError(
        response,
        "Failed to save profile settings"
      )
    );
  }

  return response.json();
}

/**
 * Upload ADMIN profile image.
 */
export async function uploadAdminProfileImage(
  file: File
) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/profile/upload-image`,
    {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(
      await readError(
        response,
        "Failed to upload profile image"
      )
    );
  }

  return response.json();
}

/**
 * Change ADMIN password.
 */
export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
) {
  const response = await fetch(
    `${API_URL}/change-password`,
    {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      await readError(
        response,
        "Failed to change password"
      )
    );
  }

  return response.json();
}