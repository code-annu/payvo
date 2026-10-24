import { env } from "@/config/env.ts";
import axios from "axios";

const axiosClient = axios.create({
  baseURL: env.baseApiUrl,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

export default axiosClient;
