import Axios from "axios";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UserDataDto } from "@/api/generated/models/userDataDto";
import { AuthContext, type AuthContextValue } from "./auth-context-def";
import type { LoginSuccessResponseDto } from "@/api/generated/models/loginSuccessResponseDto";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "@/api/token-store";
import {
  authControllerLogin,
  authControllerLogout,
  authControllerGetProfile,
} from "@/api/generated/authentication/authentication";

/**
 * Plain Axios instance WITHOUT interceptors — used exclusively for session
 * restore to avoid the response interceptor's auto-refresh logic which can
 * call clearTokens() and redirect to /login on failure.
 */
const plainAxios = Axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
});

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDataDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guard against React StrictMode double-invoke of useEffect.
  // StrictMode in dev mode runs effects twice (mount → unmount → re-mount).
  // Without this guard, two parallel refresh requests fire:
  //   1st succeeds → backend rotates refresh token
  //   2nd fails (old token invalid) → interceptor calls clearTokens()
  const restoreCalledRef = useRef(false);

  // ── Session restore on mount ──
  useEffect(() => {
    if (restoreCalledRef.current) return;
    restoreCalledRef.current = true;

    const restoreSession = async () => {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Use plainAxios (no interceptors) to prevent:
        // - The response interceptor from calling clearTokens() + redirect
        //   if the refresh fails for any reason
        // - Double-refresh race conditions between restoreSession and
        //   the interceptor's own refresh logic
        const refreshResponse = await plainAxios.post("/v1/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = refreshResponse.data.data.accessToken;
        const newRefreshToken = refreshResponse.data.data.refreshToken;

        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);

        // Fetch user profile — this goes through the main Axios instance
        // which will now have the correct access token set in memory
        const profileResponse = (await authControllerGetProfile()) as {
          data: { user: UserDataDto };
        };
        setUser(profileResponse.data.user);
      } catch {
        // Refresh failed — clear stale tokens
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = (await authControllerLogin({
      email,
      password,
    })) as unknown as LoginSuccessResponseDto;

    const newAccessToken = response.data.accessToken;
    const newRefreshToken = response.data.refreshToken;
    const userData = response.data.user;

    setAccessToken(newAccessToken);
    setRefreshToken(newRefreshToken);
    setUser(userData);
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await authControllerLogout({ refreshToken });
      }
    } catch {
      // Silently ignore logout API errors — we clear client state regardless
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  // ── Update User ──
  const updateUser = useCallback((updatedUser: UserDataDto) => {
    setUser(updatedUser);
  }, []);

  // ── Memoized value ──
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken: getAccessToken(),
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      updateUser,
    }),
    [user, isLoading, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
