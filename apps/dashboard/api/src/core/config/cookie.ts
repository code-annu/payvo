import { jwtConfig } from "@payvo/config";
import { CookieOptions } from "express";

export const REFRESH_TOKEN_COOKIE = {
  KEY: "refreshToken",
  OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: jwtConfig.REFRESH_TOKEN.EXPIRY_DAYS * 24 * 60 * 60 * 1000, // days
  } as CookieOptions,
};
