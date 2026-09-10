import { AppError } from "@payvo/shared/error";
import { NextFunction, Request, Response } from "express";

export default function handleError(
  error: Error,
  _: Request,
  res: Response,
  next: NextFunction,
) {
  // console.log(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER",
      message: error.message,
    },
  });

  next();
}
