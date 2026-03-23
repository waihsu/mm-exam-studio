/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import type { AuthUser, UserRole } from "../types";

export type AdminAuthSnapshot = {
  user: AuthUser | null;
  roles: UserRole[];
  isStudent: boolean;
  isInstructor: boolean;
  isAdmin: boolean;
  canAccessAdmin: boolean;
};

const AdminAuthContext = createContext<AdminAuthSnapshot | null>(null);

export function AdminAuthProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AdminAuthSnapshot | null;
}) {
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuthSnapshot = () => useContext(AdminAuthContext);
