import { NextFunction, Request, Response } from "express";
import JWTUtil, { JWTPayload } from "../util/jwt.util";
import {
  InvalidAccessTokenError,
  MissingAccessTokenError,
} from "@/modules/auth/auth.errors";

export interface AuthRequest extends Request {
  auth?: JWTPayload;
}

const jwtUtil = new JWTUtil();

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
    const payload = jwtUtil.verifyAccessToken(token);
    req.auth = payload;
    next();
  } catch (error) {
    throw new InvalidAccessTokenError("Invalid or expired token");
  }
}
