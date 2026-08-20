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

const SESSION_KEYS = {
  ADMIN: "campusvita_admin_session",
  USER: "campusvita_user_session",
} as const;

function getStorageKey(role: UserRole) {
  return SESSION_KEYS[role];
}

export function saveSession(session: Session) {
  if (typeof window === "undefined") return;

  const role = session.user.role;

  localStorage.setItem(
    getStorageKey(role),
    JSON.stringify(session)
  );

  // Keep compatibility with your existing code for now.
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("userRole", role);
  localStorage.setItem("userEmail", session.user.email);
  localStorage.setItem("email", session.user.email);
  localStorage.setItem("userName", session.user.name);
}

export function getSession(role: UserRole): Session | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(getStorageKey(role));

  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(getStorageKey(role));
    return null;
  }
}

export function getAccessToken(role: UserRole): string | null {
  const session = getSession(role);

  return session?.accessToken || null;
}

export function getCurrentRole(): UserRole | null {
  if (typeof window === "undefined") return null;

  const role = localStorage.getItem("userRole");

  if (role === "ADMIN" || role === "USER") {
    return role;
  }

  return null;
}

export function isLoggedIn(role: UserRole): boolean {
  return getSession(role) !== null;
}

export function clearSession(role: UserRole) {
  if (typeof window === "undefined") return;

  localStorage.removeItem(getStorageKey(role));

  /*
   * Only clear the old compatibility keys if the
   * currently active role is being logged out.
   */
  if (localStorage.getItem("userRole") === role) {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("email");
    localStorage.removeItem("userName");

    // Old token keys
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("expires_in");
  }
}

export function clearAllSessions() {
  if (typeof window === "undefined") return;

  Object.values(SESSION_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("email");
  localStorage.removeItem("userName");

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("expires_in");
}

export function getSessionForPath(pathname: string): Session | null {
  if (pathname.startsWith("/admin")) {
    return getSession("ADMIN");
  }

  return getSession("USER");
}

export function getRoleForPath(pathname: string): UserRole {
  if (pathname.startsWith("/admin")) {
    return "ADMIN";
  }

  return "USER";
}