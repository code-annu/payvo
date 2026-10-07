import { NextFunction, Response } from "express";
import { AuthRequest } from "./authenticate.middleware.js";
import container from "../di/inversify.config.js";
import TYPES from "../di/inversify.types.js";
import { InvalidCredentialsError } from "@/modules/auth/error/auth.errors.js";
import UserCache from "@/modules/user/user.cache.js";

export default async function requireActiveUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const userCacheService = container.get<UserCache>(TYPES.UserCache);
  const userId = req.auth!.sub;
  const cachedUser = await userCacheService.getCachedUser(userId);
  if (!cachedUser) {
    throw new InvalidCredentialsError("Auth credentials are no longer valid");
  }
  next();
}
