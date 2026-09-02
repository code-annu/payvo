import { config } from "dotenv";

config();
const NODE_ENV = process.env.NODE_ENV;
const DB_NAME = `${process.env.DB_NAME}-${NODE_ENV}`;

const ENV = {
  PORT: Number(process.env.PORT),
  DATABASE_URL: `${process.env.DATABASE_URL}/${DB_NAME}`,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
  ACCESS_TOKEN_EXPIRY_MIN: Number(process.env.ACCESS_TOKEN_EXPIRY_MIN),
  REFRESH_TOKEN_EXPIRY_DAYS: Number(process.env.REFRESH_TOKEN_EXPIRY_DAYS),
};

export default ENV;
