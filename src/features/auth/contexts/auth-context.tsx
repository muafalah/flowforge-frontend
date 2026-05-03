import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { UserDataDto } from "@/api/generated/models/userDataDto";
import { AuthContext, type AuthContextValue } from "./auth-context-def";
import type { LoginSuccessResponseDto } from "@/api/generated/models/loginSuccessResponseDto";
import type { RefreshTokenSuccessResponseDto } from "@/api/generated/models/refreshTokenSuccessResponseDto";
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
  authControllerRefresh,
  authControllerGetProfile,
} from "@/api/generated/authentication/authentication";

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDataDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Session restore on mount ──
  useEffect(() => {
    const restoreSession = async () => {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Call refresh endpoint to get new tokens
        const refreshResponse = (await authControllerRefresh({
          refreshToken,
        })) as unknown as RefreshTokenSuccessResponseDto;

        const newAccessToken = refreshResponse.data.accessToken;
        const newRefreshToken = refreshResponse.data.refreshToken;

        setAccessToken(newAccessToken);
        setRefreshToken(newRefreshToken);

        // Fetch user profile
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

  // ── Memoized value ──
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken: getAccessToken(),
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
