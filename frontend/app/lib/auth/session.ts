export type UserRole = "ADMIN" | "USER" | "VENDOR";

export type SessionUser = {
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  department?: string;
  year?: string;
  profile_image?: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: SessionUser;
};

export const SESSION_KEYS: Record<UserRole, string> = {
  ADMIN: "campusvita_admin_session",
  USER: "campusvita_user_session",
  VENDOR: "campusvita_vendor_session",
};

/**
 * Get the correct browser storage for each role.
 *
 * ADMIN and USER:
 * - Use localStorage.
 * - Their existing behavior remains unchanged.
 *
 * VENDOR:
 * - Use sessionStorage.
 * - sessionStorage is isolated per browser tab.
 * - This prevents Vendor 2 from overwriting Vendor 1
 *   when both vendors are logged in in different tabs.
 */
function getStorage(role: UserRole): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  // USER and VENDOR sessions are isolated per browser tab.
  // This prevents one customer/vendor login from
  // overwriting another login in a different tab.
  if (role === "USER" || role === "VENDOR") {
    return window.sessionStorage;
  }

  // ADMIN remains in localStorage.
  return window.localStorage;
}

function getStorageKey(role: UserRole): string {
  return SESSION_KEYS[role];
}

/**
 * Save a session only inside the storage namespace
 * belonging to that session's role.
 */
export function saveSession(session: Session): void {
  if (typeof window === "undefined") {
    return;
  }

  const role = session.user.role;

  if (
    role !== "ADMIN" &&
    role !== "USER" &&
    role !== "VENDOR"
  ) {
    console.error("Invalid session role:", role);
    return;
  }

  const storage = getStorage(role);

  if (!storage) {
    return;
  }

  storage.setItem(
    getStorageKey(role),
    JSON.stringify(session)
  );
}

/**
 * Read ONLY the requested role's session.
 */
export function getSession(
  role: UserRole
): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storage = getStorage(role);

  if (!storage) {
    return null;
  }

  const raw = storage.getItem(
    getStorageKey(role)
  );

  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as Session;

    if (
      !session ||
      !session.accessToken ||
      !session.user
    ) {
      storage.removeItem(
        getStorageKey(role)
      );

      return null;
    }

    if (session.user.role !== role) {
      console.error(
        `Invalid ${role} session: stored role is ${session.user.role}`
      );

      storage.removeItem(
        getStorageKey(role)
      );

      return null;
    }

    return session;
  } catch (error) {
    console.error(
      `Invalid ${role} session JSON`,
      error
    );

    storage.removeItem(
      getStorageKey(role)
    );

    return null;
  }
}

/**
 * Get the access token for a specific role.
 */
export function getAccessToken(
  role: UserRole
): string | null {
  return getSession(role)?.accessToken ?? null;
}

/**
 * Get the logged-in user for a specific role.
 */
export function getSessionUser(
  role: UserRole
): SessionUser | null {
  return getSession(role)?.user ?? null;
}

/**
 * Check whether a specific role is logged in.
 */
export function isLoggedIn(
  role: UserRole
): boolean {
  return getSession(role) !== null;
}

/**
 * Returns the session for the requested application area.
 *
 * IMPORTANT:
 * Never use this to decide which role a user should have.
 * The pathname determines the required role.
 */
export function getSessionForPath(
  pathname: string
): Session | null {
  if (pathname.startsWith("/admin")) {
    return getSession("ADMIN");
  }

  if (pathname.startsWith("/vendor")) {
    return getSession("VENDOR");
  }

  return getSession("USER");
}

/**
 * Determine which role is required for a pathname.
 */
export function getRoleForPath(
  pathname: string
): UserRole {
  if (pathname.startsWith("/admin")) {
    return "ADMIN";
  }

  if (pathname.startsWith("/vendor")) {
    return "VENDOR";
  }

  return "USER";
}

/**
 * Clear ONLY one role's session.
 *
 * For Vendor:
 * - Removes the Vendor session from sessionStorage.
 * - Does NOT affect another browser tab.
 */
export function clearSession(
  role: UserRole
): void {
  if (typeof window === "undefined") {
    return;
  }

  const storage = getStorage(role);

  if (!storage) {
    return;
  }

  storage.removeItem(
    getStorageKey(role)
  );
}

/**
 * Clear all application sessions.
 *
 * ADMIN + USER sessions are stored in localStorage.
 * VENDOR session is stored in sessionStorage.
 */
export function clearAllSessions(): void {
  if (typeof window === "undefined") {
    return;
  }

  // ADMIN session
  localStorage.removeItem(
    SESSION_KEYS.ADMIN
  );

  // USER session
sessionStorage.removeItem(
  SESSION_KEYS.USER
);

// Remove any old USER session that may have
// been created by the previous localStorage implementation.
localStorage.removeItem(
  SESSION_KEYS.USER
);

  // VENDOR session
  sessionStorage.removeItem(
    SESSION_KEYS.VENDOR
  );

  // Remove an old Vendor session that may have
  // been created by the previous implementation.
  localStorage.removeItem(
    SESSION_KEYS.VENDOR
  );

  // Remove legacy authentication keys.
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("email");
  localStorage.removeItem("userName");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("expires_in");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("token");
}