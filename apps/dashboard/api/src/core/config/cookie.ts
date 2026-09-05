import { sessionConfig } from "@payvo/config/auth";
import { CookieOptions } from "express";

export const REFRESH_TOKEN_COOKIE = {
  KEY: "refreshToken",
  OPTIONS: {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/api/auth/rotate-token",
    maxAge: sessionConfig.refreshToken.expiryDays * 24 * 60 * 60 * 1000, // days
  } as CookieOptions,
};
