import { NextFunction, Request, Response } from "express";
import { serverConfig } from "@payvo/config/server";
import {
  InvalidFrontendSecretError,
  MissingFrontendSecretError,
} from "@/modules/auth/error/auth.errors.js";

export function authenticateFrontend(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const frontendSecret =
      req.header("x-frontend-secret") ?? req.header("x-gateway-secret");

    if (!frontendSecret) {
      throw new MissingFrontendSecretError();
    }

    if (frontendSecret !== serverConfig.frontendSecret) {
      throw new InvalidFrontendSecretError(
        "This transaction is not allowed from your registered domain.",
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

export default authenticateFrontend;
