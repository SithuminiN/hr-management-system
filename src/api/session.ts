// Tiny helper used by the MOCK mode (and the stub AuthContext) to remember who is "logged in".
// When Frontend 1's real auth is ready you can stop using this file.
import type { User } from "../types";

const KEY = "hrms_session_user";

export function getSessionUser(): User | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function setSessionUser(user: User | null) {
  if (user) localStorage.setItem(KEY, JSON.stringify(user));
  else localStorage.removeItem(KEY);
}
