import axiosClient from "./axios.client";
import ErrorCode from "@/core/api/ErrorCode";
import AuthApi from "@/features/auth/api/auth.api";
import { authToken } from "@/features/auth/auth.store";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code?: string; message?: string } }>) => {
    const originalRequest = error.config as CustomAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Do not attempt rotation if the failed request itself is the token rotation endpoint
    if (originalRequest.url?.includes("/auth/rotate-token")) {
      return Promise.reject(error);
    }

    const errorCode = error.response?.data?.error?.code;
    const isAccessTokenError =
      errorCode === ErrorCode.INVALID_ACCESS_TOKEN ||
      errorCode === ErrorCode.MISSING_ACCESS_TOKEN;

    // If error code is not an access token error, reject immediately
    if (!isAccessTokenError) {
      return Promise.reject(error);
    }

    // If this request was already retried, do not retry again (only retry one time)
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // If token rotation is already in progress, enqueue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest._retry = true;
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            resolve(axiosClient(originalRequest));
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    // Mark as retried and mark refresh in progress
    originalRequest._retry = true;
    isRefreshing = true;

    return new Promise((resolve, reject) => {
      AuthApi.rotateToken()
        .then((data) => {
          const newAccessToken = data.accessToken;
          authToken.set(newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          processQueue(null, newAccessToken);
          resolve(axiosClient(originalRequest));
        })
        .catch((refreshError) => {
          authToken.clear();
          processQueue(refreshError, null);
          reject(refreshError);
        })
        .finally(() => {
          isRefreshing = false;
        });
    });
  },
);
