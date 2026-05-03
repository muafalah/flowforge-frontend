import { useContext } from "react";
import { AuthContext } from "../contexts/auth-context-def";

/**
 * Custom hook to access auth state and actions.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
