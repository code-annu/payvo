import { NextFunction, Request, Response } from "express";
import { JWTPayloadType, JWTService } from "@payvo/shared/jwt";
import {
  InvalidAccessTokenError,
  MissingAccessTokenError,
} from "@/modules/auth/error/auth.errors.js";
import { jwtConfig } from "@payvo/config";

export interface AuthRequest extends Request {
  auth?: JWTPayloadType;
}

const jwtService = new JWTService();

export default function authenticateUser(
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
    const payload = jwtService.verifyAccessToken<JWTPayloadType>(
      token,
      jwtConfig.ACCESS_TOKEN.SECRET,
    );
    req.auth = payload;
    next();
  } catch (error) {
    throw new InvalidAccessTokenError("Invalid or expired token");
  }
}
