import { config } from "dotenv";

config();

const ENV = {
  PORT: parseInt(process.env.PORT!),
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN!,
  JWT_REFRESH_EXPIRES_IN: parseInt(process.env.JWT_REFRESH_EXPIRES_IN!),
  SESSION_EXPIRY_DAYS: parseInt(process.env.SESSION_EXPIRY_DAYS!),
};

export default ENV;
