import { createContext } from "react";
import type { UserDataDto } from "@/api/generated/models/userDataDto";

/**
 * Auth context value shape.
 * Separated from the provider to satisfy react-refresh/only-export-components.
 */
export interface AuthContextValue {
  user: UserDataDto | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
