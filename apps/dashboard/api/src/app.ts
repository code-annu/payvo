import { handleError } from "@payvo/http/handler";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import container from "./core/di/inversify.config.js";
import AuthRouter from "./modules/auth/auth.router.js";
import AccountRouter from "./modules/account/account.router.js";
import TYPES from "./core/di/inversify.types.js";
import handlePrismaError from "./core/middleware/prisma-error.middleware.js";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const authRouter = container.get<AuthRouter>(TYPES.AuthRouter);
app.use("/api/auth", authRouter.router);

const accountRouter = container.get<AccountRouter>(TYPES.AccountRouter);
app.use("/api/account", accountRouter.router);

app.use(handlePrismaError, handleError);

export default app;
