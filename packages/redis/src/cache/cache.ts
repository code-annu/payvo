import { redisCacheClient } from "../client/redis.client.js";

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const value = await redisCacheClient.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Redis getCache error:", error);
    return null; // graceful degradation — fall through to DB
  }
}

export async function setCache<T>(input: {
  key: string;
  value: T;
  ttlSeconds: number;
}): Promise<void> {
  try {
    const { key, value, ttlSeconds } = input;
    await redisCacheClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.error("Redis setCache error:", error);
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redisCacheClient.del(key);
  } catch (error) {
    console.error("Redis deleteCache error:", error);
  }
}
