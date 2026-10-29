// STUB auth context (Frontend Intern 1 builds the real one).
// My pages only need:  const { user } = useAuth();   ->  user.role / user.employeeId / user.name
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { User } from "../types";
import { getSessionUser, setSessionUser } from "../api/session";

export const DEMO_USERS: User[] = [
  { id: 1, employeeId: 1, name: "Nimal Perera (Admin)", role: "Admin" },
  { id: 2, employeeId: 2, name: "Kamal Silva (Manager)", role: "Manager" },
  { id: 3, employeeId: 3, name: "Sunil Fernando (Employee)", role: "Employee" },
  { id: 4, employeeId: 4, name: "Amali Jayasinghe (Employee)", role: "Employee" },
];

interface AuthValue {
  user: User;
  switchUser: (id: number) => void; // only for demo/testing
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => getSessionUser() ?? DEMO_USERS[2]);

  const switchUser = useCallback((id: number) => {
    const next = DEMO_USERS.find((u) => u.id === id);
    if (next) {
      setSessionUser(next);
      setUser(next);
    }
  }, []);

  const value = useMemo(() => ({ user, switchUser }), [user, switchUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
