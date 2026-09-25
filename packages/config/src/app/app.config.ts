import ENV from "../env/load.js";

export const appConfig = {
  port: ENV.PORT,
  internalSecret: ENV.INTERNAL_SECRET,
  dashboardInternalUrl: ENV.DASHBOARD_INTERNAL_URL,
};
