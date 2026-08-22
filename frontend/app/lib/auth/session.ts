export type UserRole = "ADMIN" | "USER";

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
};

function getStorageKey(role: UserRole): string {
  return SESSION_KEYS[role];
}

/**
 * Save a session only inside the storage namespace
 * belonging to that session's role.
 */
export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;

  const role = session.user.role;

  if (role !== "ADMIN" && role !== "USER") {
    console.error("Invalid session role:", role);
    return;
  }

  localStorage.setItem(
    getStorageKey(role),
    JSON.stringify(session)
  );
}

/**
 * Read ONLY the requested role's session.
 */
export function getSession(role: UserRole): Session | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(getStorageKey(role));

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
      localStorage.removeItem(getStorageKey(role));
      return null;
    }

    if (session.user.role !== role) {
      console.error(
        `Invalid ${role} session: stored role is ${session.user.role}`
      );

      localStorage.removeItem(getStorageKey(role));
      return null;
    }

    return session;
  } catch (error) {
    console.error(
      `Invalid ${role} session JSON`,
      error
    );

    localStorage.removeItem(getStorageKey(role));
    return null;
  }
}

export function getAccessToken(
  role: UserRole
): string | null {
  return getSession(role)?.accessToken ?? null;
}

export function getSessionUser(
  role: UserRole
): SessionUser | null {
  return getSession(role)?.user ?? null;
}

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
  return pathname.startsWith("/admin")
    ? getSession("ADMIN")
    : getSession("USER");
}

export function getRoleForPath(
  pathname: string
): UserRole {
  return pathname.startsWith("/admin")
    ? "ADMIN"
    : "USER";
}

/**
 * Clear ONLY one role's session.
 */
export function clearSession(
  role: UserRole
): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(getStorageKey(role));
}

/**
 * Clear both role sessions.
 *
 * Use this ONLY when intentionally signing out
 * of the entire application.
 */
export function clearAllSessions(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(
    SESSION_KEYS.ADMIN
  );

  localStorage.removeItem(
    SESSION_KEYS.USER
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
