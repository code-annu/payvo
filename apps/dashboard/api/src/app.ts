import { handleError } from "@payvo/http/handler";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import container from "./core/di/container.js";
import { AuthTypes } from "./modules/auth/auth.module.js";
import { AccountTypes } from "./modules/account/account.module.js";
import AuthRouter from "./modules/auth/auth.router.js";
import ProfileRouter from "./modules/account/router/user-profile.router.js";
import UserAddressRouter from "./modules/account/router/user-address.router.js";
import { MerchantTypes } from "./modules/merchant/merchant.module.js";
import MerchantRouter from "./modules/merchant/router/merchant.router.js";
import { ApiKeyTypes } from "./modules/api-key/api-key.module.js";
import ApiKeyRouter from "./modules/api-key/router/api-key.router.js";
import handlePrismaError from "./core/middleware/prisma-error.middleware.js";
import { serverConfig } from "@payvo/config/server";
import cors from "cors";

const app: Express = express();

const corsOptions = {
  origin: serverConfig.frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you're sending cookies or auth headers
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const authRouter = container.get<AuthRouter>(AuthTypes.AuthRouter);
app.use("/api/auth", authRouter.router);

const profileRouter = container.get<ProfileRouter>(AccountTypes.ProfileRouter);
app.use("/api/account/profile", profileRouter.router);

const userAddressRouter = container.get<UserAddressRouter>(
  AccountTypes.UserAddressRouter,
);
app.use("/api/account/addresses", userAddressRouter.router);

const merchantRouter = container.get<MerchantRouter>(
  MerchantTypes.MerchantRouter,
);
app.use("/api/merchants", merchantRouter.router);

const apiKeyRouter = container.get<ApiKeyRouter>(ApiKeyTypes.ApiKeyRouter);
app.use("/api/merchants/:merchantId/api-keys", apiKeyRouter.router);

app.use(handlePrismaError, handleError);

export default app;
