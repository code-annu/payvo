import { MissingApiKeyCredentialsError } from "@/modules/auth/auth.errors.js";
import axios from "axios";
import { NextFunction, Request, Response } from "express";
import { axiosClient } from "../axios/axios.client.js";
import { AuthResponse } from "@/modules/auth/auth.response.js";
import { HttpStatusCode } from "@payvo/shared/http";
import { InternalServerError } from "@payvo/shared/error";

export interface AuthRequest extends Request {
  auth?: { merchantId: string; environment: string };
}

export async function authenticateApiKey(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const apiKeyId = req.header("x-api-key-id");
  const apiKeySecret = req.header("x-api-key-secret");

  if (!apiKeyId || !apiKeySecret) {
    throw new MissingApiKeyCredentialsError();
  }
  try {
    const response = await axiosClient.post<AuthResponse>("/validate-api-key", {
      keyId: apiKeyId,
      keySecret: apiKeySecret,
    });

    req.auth = response.data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return res.status(err.response?.status || 500).json(err.response?.data);
    } else {
      throw new InternalServerError(
        "Getting some error while calling internal service",
      );
    }
  }
  next();
}
