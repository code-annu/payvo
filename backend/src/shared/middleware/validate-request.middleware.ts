import AppErrorCode from "@/core/error/AppErrorCode";
import { BadRequestError } from "@/core/error/app.errors";
import { NextFunction, Request, Response } from "express";
import { ZodObject } from "zod";

interface ValidationSchemas {
  body?: ZodObject<any>;
  query?: ZodObject<any>;
  params?: ZodObject<any>;
  cookies?: ZodObject<any>;
}

export const validateRequest =
  (schemas: ValidationSchemas) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw new BadRequestError(
          "Missing or invalid request body",
          result.error.issues.map((issue) => ({
            message: issue.message,
            field: issue.path,
          })),
        );
      }
      req.body = result.data;
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        throw new BadRequestError(
          "Missing or invalid query parameters",
          result.error.issues.map((issue) => ({
            message: issue.message,
            field: issue.path,
          })),
        );
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        throw new BadRequestError(
          "Missing or invalid path parameters",
          result.error.issues.map((issue) => ({
            message: issue.message,
            field: issue.path,
          })),
        );
      }
    }

    if (schemas.cookies) {
      const result = schemas.cookies.safeParse(req.cookies);
      if (!result.success) {
        throw new BadRequestError(
          "Missing or invalid cookies",
          result.error.issues.map((issue) => ({
            message: issue.message,
            field: issue.path,
          })),
        );
      }
    }

    next();
  };
