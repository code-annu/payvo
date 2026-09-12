import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import handleError from "./core/middleware/error-handler.middleware.js";
import container from "./core/di/inversify.config.js";
import TYPES from "./core/di/inversify.types.js";
import AuthRouter from "./modules/auth/auth.router.js";
import UserRouter from "./modules/user/user.router.js";
import MerchantRouter from "./modules/merchant/merchant.router.js";
import ApiKeyRouter from "./modules/api-key/api-key.router.js";

const app: Express = express();

// app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const authRouter = container.get<AuthRouter>(TYPES.AuthRouter);
app.use("/api/auth", authRouter.router);

const userRouter = container.get<UserRouter>(TYPES.UserRouter);
app.use("/api/user", userRouter.router);

const merchantRouter = container.get<MerchantRouter>(TYPES.MerchantRouter);
app.use("/api/merchant", merchantRouter.router);
app.use("/api/merchants", merchantRouter.router);

const apiKeyRouter = container.get<ApiKeyRouter>(TYPES.ApiKeyRouter);
app.use("/api", apiKeyRouter.router);

app.use(handleError);

export default app;
