import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import container from "./core/di/inversify.config.js";
import TYPES from "./core/di/inversify.types.js";
import AuthRouter from "./modules/auth/auth.router.js";
import AccountRouter from "./modules/account/account.router.js";
import handleError from "./core/middleware/error-handler.middleware.js";
import ApiKeyRouter from "./modules/api-key/api-key.router.js";
import MerchantRouter from "./modules/merchant/merchant.router.js";
import InternalRouter from "./internals/internal.router.js";
import cors from "cors";
import { serverConfig } from "@payvo/config/server";

const app: Express = express();

const corsOptions = {
  origin: serverConfig.frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // if you're sending cookies or auth headers
};

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

// Auth routes
const authRouter = container.get<AuthRouter>(TYPES.AuthRouter);
app.use("/api/auth", authRouter.router);

// Account routes
const accountRouter = container.get<AccountRouter>(TYPES.AccountRouter);
app.use("/api/account", accountRouter.router);

// Merchant routes
const merchantRouter = container.get<MerchantRouter>(TYPES.MerchantRouter);
app.use("/api/merchants", merchantRouter.router);

// Api-Key routes
const apiKeyRouter = container.get<ApiKeyRouter>(TYPES.ApiKeyRouter);
app.use(
  "/api/merchants/:merchantId/api-keys",
  apiKeyRouter.merchantApiKeyRouter,
);
app.use("/api/api-keys", apiKeyRouter.router);

// Internal routes
const internalRouter = container.get<InternalRouter>(TYPES.InternalRouter);
app.use("/internal", internalRouter.router);

app.use(handleError);

export default app;
