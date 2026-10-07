import { Redis } from "ioredis";
import { redisConfig } from "@payvo/config/redis";

export const redisCacheClient = new Redis(redisConfig.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    return Math.min(times * 200, 2000);
  },
});

redisCacheClient.on("connect", () => console.log("Redis connected ✅️"));

redisCacheClient.on("ready", () => console.log("Redis ready ✅️"));

redisCacheClient.on("error", (err: unknown) =>
  console.error("Redis error ❌️", err),
);

redisCacheClient.on("close", () => console.warn("Redis connection closed ⛔️"));
