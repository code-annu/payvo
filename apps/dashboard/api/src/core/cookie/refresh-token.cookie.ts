import { sessionConfig } from "@payvo/config/auth";
import { serverConfig } from "@payvo/config/server";
import { CookieOptions, Response } from "express";

const isProd = serverConfig.nodeEnv === "production";
export const REFRESH_COOKIE = "refreshToken";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: !isProd,
  secure: isProd,
  sameSite: isProd ? "strict" : "lax",
  path: "/api/auth",
  maxAge: sessionConfig.sessionExpiryDays * 24 * 60 * 60 * 1000,
};

export const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
};

export const clearRefreshCookie = (res: Response) => {
  const { ...opts } = refreshCookieOptions;
  res.clearCookie(REFRESH_COOKIE, opts);
};
