import { buildErrorResponse } from "@payvo/shared/api";
import { AppError } from "@payvo/shared/error";
import { NextFunction, Request, Response } from "express";

export function handleError(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // console.error("error is: ", error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json(
      buildErrorResponse({
        code: error.code,
        message: error.message,
        details: error.details,
      }),
    );
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER",
      message: "Something went wrong with database or server",
    },
  });
}
