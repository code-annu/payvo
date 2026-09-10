// import {
//   InvalidInternalSecretError,
//   MissingInternalSecretError,
// } from "@/internals/error/internal.errors.js";
// import { appConfig } from "@payvo/config/app";
// import { NextFunction, Request, Response } from "express";

// export default async function authenticateInternals(
//   req: Request,
//   _res: Response,
//   next: NextFunction,
// ) {
//   const internalSecret = req.header("X-Internal-Secret");
//   if (!internalSecret) throw new MissingInternalSecretError();
//   if (internalSecret !== appConfig.internalSecret) {
//     throw new InvalidInternalSecretError();
//   }
//   next();
// }
