import ENV from "../env/load.js";

export const sessionConfig = {
  sessionExpiryDays: Number(ENV.SESSION_EXPIRY_DAYS),
};
