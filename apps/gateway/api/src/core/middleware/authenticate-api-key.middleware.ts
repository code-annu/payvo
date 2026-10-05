import { MissingApiKeyCredentialsError } from "@/modules/auth/error/auth.errors.js";
import { NextFunction, Request, Response } from "express";
import container from "../di/inversify.config.js";
import TYPES from "../di/inversify.types.js";
import ValidateApiKeyUsecase from "@/modules/auth/application/usecase/ValidateApiKeyUsecase.js";
import type { ApiKeyEnvironment } from "@/modules/auth/entity/api-key.entity.js";

export interface AuthRequest extends Request {
  auth?: { merchantId: string; environment: ApiKeyEnvironment };
}

export async function authenticateApiKey(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    const apiKeyId = req.header("x-api-key-id");
    const apiKeySecret = req.header("x-api-key-secret");

    if (!apiKeyId || !apiKeySecret) {
      throw new MissingApiKeyCredentialsError();
    }

    const validateApiKeyUsecase = container.get<ValidateApiKeyUsecase>(
      TYPES.ValidateApiKeyUsecase,
    );

    const authData = await validateApiKeyUsecase.execute({
      keyId: apiKeyId,
      keySecret: apiKeySecret,
    });

    req.auth = authData;
    next();
  } catch (err) {
    next(err);
  }
}
