import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_API_URL,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
    "x-gateway-secret": "future secret",
  },
  withCredentials: true,
});

export default axiosClient;
