import { appConfig } from "@payvo/config/app";
import axios from "axios";

export const axiosClient = axios.create({
  baseURL: appConfig.dashboardInternalUrl,
  headers: {
    "Content-Type": "application/json",
    "x-internal-secret": appConfig.internalSecret,
  },
});
