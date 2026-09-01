import { NextFunction, Request, Response } from "express";
import {
  InvalidAccessTokenError,
  MissingAccessTokenError,
} from "@/modules/auth/error/auth.errors.js";
import { AccessTokenPayload, verifyAccessToken } from "@payvo/shared/auth/jwt";
import { jwtConfig } from "@payvo/config/auth";

export interface AuthRequest extends Request {
  auth?: AccessTokenPayload;
}

export default async function authenticateUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new MissingAccessTokenError("Authorization token is required");
  }
  const token = authHeader.substring("Bearer ".length).trim();
  try {
    const payload = await verifyAccessToken(
      token,
      jwtConfig.accessToken.secret,
    );
    req.auth = payload;
    next();
  } catch (error) {
    throw new InvalidAccessTokenError("Invalid or expired token");
  }
}
