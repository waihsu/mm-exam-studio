/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import type { AppAuthSnapshot } from "../types";

const AppAuthContext = createContext<AppAuthSnapshot | null>(null);

export function AppAuthProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AppAuthSnapshot | null;
}) {
  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export const useAppAuthSnapshot = () => useContext(AppAuthContext);
