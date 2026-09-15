import { redisConfig } from "@payvo/config/redis";
import { createClient } from "redis";

export const redisClient = createClient({
  url: redisConfig.redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 100, 2000);
      return delay;
    },
  },
});

redisClient.on("error", (error) => {
  // TODO: use logger
  console.error("Redis Client Error", error);
});
