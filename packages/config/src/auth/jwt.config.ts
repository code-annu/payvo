import ENV from "../env/load.js";

export const jwtConfig = {
  accessToken: {
    secret: ENV.ACCESS_TOKEN_SECRET,
    expiryMinutes: Number(ENV.ACCESS_TOKEN_EXPIRY_MIN),
  },
};
