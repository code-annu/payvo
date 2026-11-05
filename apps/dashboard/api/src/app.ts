import { handleError } from "@payvo/http/handler";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import container from "./core/di/container.js";
import { AuthTypes } from "./modules/auth/auth.module.js";
import { AccountTypes } from "./modules/account/account.module.js";
import AuthRouter from "./modules/auth/auth.router.js";
import AccountRouter from "./modules/account/router/account.router.js";
import UserAddressRouter from "./modules/account/router/user-address.router.js";
import handlePrismaError from "./core/middleware/prisma-error.middleware.js";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const authRouter = container.get<AuthRouter>(AuthTypes.AuthRouter);
app.use("/api/auth", authRouter.router);

const accountRouter = container.get<AccountRouter>(AccountTypes.AccountRouter);
app.use("/api/account", accountRouter.router);

const userAddressRouter = container.get<UserAddressRouter>(
  AccountTypes.UserAddressRouter,
);
app.use("/api/account/addresses", userAddressRouter.router);

app.use(handlePrismaError, handleError);

export default app;
