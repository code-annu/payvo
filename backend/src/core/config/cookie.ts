// src/config/cookie.ts

import { CookieOptions } from "express";
import ENV from "./env";

export const REFRESH_TOKEN_COOKIE = {
  KEY: "refreshToken",
  OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth/refresh",
    maxAge: ENV.JWT_REFRESH_EXPIRES_IN * 24 * 60 * 60 * 1000, // days
  } as CookieOptions,
};
