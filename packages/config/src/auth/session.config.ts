import ENV from "../env/load.js";

export const sessionConfig = {
  refreshToken: { expiryDays: ENV.REFRESH_TOKEN_EXPIRY_DAYS },
};
