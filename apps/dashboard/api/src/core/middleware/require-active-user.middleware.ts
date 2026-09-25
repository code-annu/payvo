import { NextFunction, Response } from "express";
import { AuthRequest } from "./authenticate.middleware.js";
import container from "../di/inversify.config.js";
import TYPES from "../di/inversify.types.js";
import { InvalidCredentialsError } from "@/modules/auth/error/auth.errors.js";
import UserRepository from "@/modules/user/repository/user.repository.js";

export default async function requireActiveUser(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  const userRepo = container.get<UserRepository>(TYPES.UserRepository);
  const userId = req.auth!.sub;
  const cachedUser = await userRepo.findById(userId);
  if (!cachedUser) {
    throw new InvalidCredentialsError("Auth credentials are no longer valid");
  }
  next();
}
