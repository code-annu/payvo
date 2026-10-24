import axiosClient from "./axios.client.ts";
import { authToken } from "@/features/auth/auth.store.ts";

axiosClient.interceptors.request.use(
  (config) => {
    const token = authToken.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);
