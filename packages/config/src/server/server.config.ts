import ENV from "../env/load.js";

export const serverConfig = {
  port: ENV.PORT,
  frontendUrl: ENV.FRONTEND_URL,
  frontendSecret: ENV.FRONTEND_SECRET,
};
