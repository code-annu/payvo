import "dotenv/config";

const ENV = {
  PORT: process.env.PORT!,
  DATABASE_URL: process.env.DATABASE_URL!,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  ACCESS_TOKEN_EXPIRY_MIN: process.env.ACCESS_TOKEN_EXPIRY_MIN!,
  SESSION_EXPIRY_DAYS: process.env.SESSION_EXPIRY_DAYS!,
  INTERNAL_SECRET: process.env.INTERNAL_SECRET!,
  REDIS_URL: process.env.REDIS_URL!,
};

export default ENV;
