import { redisClient } from "./client.js";

export async function connectRedis() {
  if (redisClient.isOpen) {
    return;
  }
  await redisClient.connect();
  console.log("✅ Redis connected");
}

export async function disconnectRedis() {
  if (!redisClient.isOpen) {
    return;
  }
  await redisClient.quit();
  console.log("❌ Redis disconnected");
}
