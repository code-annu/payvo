import { Prisma } from "@payvo/database/types";
import { StatusCode } from "@payvo/shared/api";
import { AppError } from "@payvo/shared/error";
import type { NextFunction, Request, Response } from "express";

export default function handlePrismaError(
  error: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return next(
      new AppError({
        message: "A record with this value already exists",
        code: "DATABASE_CONFLICT",
        statusCode: StatusCode.Error.CONFLICT,
      }),
    );
  }

  return next(error);
}
