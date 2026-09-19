import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import container from "./core/di/inversify.config.js";
import TYPES from "./core/di/inversify.types.js";
import AuthRouter from "./modules/auth/auth.router.js";
import AccountRouter from "./modules/account/account.router.js";
import MerchantRouter from "./modules/merchant/merchant.router.js";
import ApiKeyRouter from "./modules/api-key/api-key.router.js";
import handleError from "./core/middleware/error-handler.middleware.js";
import InternalRouter from "./internals/internal.router.js";

const app: Express = express();

app.use(express.json());
app.use(cookieParser());

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
app.use("/api", apiKeyRouter.router);

// Internal routes
const internalRouter = container.get<InternalRouter>(TYPES.InternalRouter);
app.use("/internal", internalRouter.router);

app.use(handleError);

export default app;
