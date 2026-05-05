import Axios from "axios";
import type { AxiosError } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
} from "./token-store";

export const AXIOS_INSTANCE = Axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
});

// ──────────────────────────────────────────────
// Axios Request Interceptor — attach access token
// ──────────────────────────────────────────────
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ──────────────────────────────────────────────
// Axios Response Interceptor — handle 401 + refresh
// ──────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the failing request IS the refresh or login endpoint
    if (
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/auth/login")
    ) {
      if (originalRequest.url?.includes("/auth/refresh")) {
        clearTokens();
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return AXIOS_INSTANCE(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      isRefreshing = false;
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    try {
      const response = await AXIOS_INSTANCE.post("/v1/auth/refresh", {
        refreshToken,
      });

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        response.data.data;

      setAccessToken(newAccessToken);
      setRefreshToken(newRefreshToken);

      processQueue(null, newAccessToken);

      // Retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return AXIOS_INSTANCE(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ──────────────────────────────────────────────
// Custom Instance for Orval
//
// Orval generates calls like: customInstance<T>(url, { method, headers, body, signal })
// We bridge the fetch-style RequestInit to Axios under the hood.
// ──────────────────────────────────────────────
export const customInstance = <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const controller = new AbortController();

  // Convert fetch-style body to Axios data
  const promise = AXIOS_INSTANCE<T>({
    url,
    method: (options?.method as string) || "GET",
    data: options?.body,
    headers: options?.headers as Record<string, string>,
    signal: options?.signal ?? controller.signal,
  }).then(({ data }) => data);

  // @ts-expect-error - Attach cancel method for react-query cancellation
  promise.cancel = () => {
    controller.abort("Query was cancelled");
  };

  return promise;
};

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
