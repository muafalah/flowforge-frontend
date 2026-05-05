/**
 * Token Store — Module-level singleton for auth token management.
 *
 * Access token is kept in memory (not localStorage) for security.
 * Refresh token is persisted in localStorage for session restoration.
 *
 * This module is intentionally decoupled from React context to avoid
 * circular dependencies with the Axios/custom-instance layer.
 */

const REFRESH_TOKEN_KEY = "refresh_token";

let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getRefreshToken = (): string | null =>
  localStorage.getItem(REFRESH_TOKEN_KEY);

export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const clearTokens = (): void => {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
