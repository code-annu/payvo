import { NextFunction, Request, Response } from "express";
import {
  InvalidAccessTokenError,
  InvalidCredentialsError,
  MissingAccessTokenError,
} from "@/modules/auth/error/auth.errors.js";
import { jwtConfig } from "@payvo/config/auth";
import { AccessTokenPayload, verifyAccessToken } from "@payvo/shared/jwt";
import container from "../di/inversify.config.js";
import TYPES from "../di/inversify.types.js";
import UserRepository from "@/modules/user/repository/user.repository.js";

export interface AuthRequest extends Request {
  auth?: AccessTokenPayload;
}

export default async function authenticateUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const userRepo = container.get<UserRepository>(TYPES.UserRepository);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new MissingAccessTokenError("Authorization token is required");
  }
  let payload;
  const token = authHeader.substring("Bearer ".length).trim();
  try {
    payload = await verifyAccessToken(token, jwtConfig.accessToken.secret);
    req.auth = payload;
  } catch (_error) {
    throw new InvalidAccessTokenError("Invalid or expired token");
  }

  const user = await userRepo.findById(payload.sub);
  if (!user) {
    throw new InvalidCredentialsError(
      "Token belongs deleted or non active user",
    );
  }

  next();
}
