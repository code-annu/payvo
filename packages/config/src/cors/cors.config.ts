import ENV from "../env/load.js";

export const corsConfig = {
  origin: ENV.FRONTEND_URL,
};
